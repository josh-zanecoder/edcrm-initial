import { create } from 'zustand';
import { Device, Call } from '@twilio/voice-sdk';
import { onSnapshot, DocumentSnapshot, DocumentData, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Helper function to handle incoming call setup
const handleIncomingCallSetup = (device: Device, call: Call, set: (state: Partial<CallState>) => void, get: () => CallState) => {
  console.log('Raw call object:', call);
  console.log('Call direction:', call.direction);
  
  const phoneNumber = call.parameters?.From || 'Unknown';
  let callerName = 'Unknown';
  
  if (call.direction === 'INCOMING') {
    const entries = Array.from(call.customParameters?.entries() || []);
    const firstName = entries.find(([key]) => key === 'FirstName')?.[1];
    const lastName = entries.find(([key]) => key === 'LastName')?.[1];
    
    if (firstName || lastName) {
      callerName = [firstName, lastName].filter(Boolean).join(' ').trim();
    } else {
      callerName = phoneNumber;
    }
  } else {
    callerName = phoneNumber;
  }
  
  console.log('Final caller info:', { phoneNumber, callerName });
  const callSid = call.parameters?.CallSid;

  // Create a function for the cancel handler that we can remove later
  const handleCancel = () => {
    console.log('Incoming call canceled by caller:', { 
      callSid, 
      from: phoneNumber,
      deviceState: device.state,
      isCallAnswered: get().isCallAnswered,
      timestamp: new Date().toISOString()
    });

    // Only reset state if call wasn't already accepted
    if (!get().isCallAnswered) {
      set({ 
        hasIncomingCall: false,
        incomingCallData: null,
        isCalling: false
      });
      console.log('Call state reset due to cancel');
    } else {
      console.log('Ignoring cancel event as call was already accepted');
    }
  };

  // Set up call event listeners
  call.on('accept', () => {
    console.log('Incoming call accepted:', { 
      callSid, 
      from: phoneNumber,
      deviceState: device.state,
      timestamp: new Date().toISOString()
    });

    // Remove the cancel listener when accepting the call
    call.removeListener('cancel', handleCancel);
    console.log('Removed cancel event listener');

    const startTime = Date.now();
    const durationInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      set({ callDuration: duration });
    }, 1000);

    set({ 
      currentCall: call,
      callStartTime: startTime,
      callDurationInterval: durationInterval,
      isCallAnswered: true,
      isCalling: true,
      hasIncomingCall: false
    });

    console.log('Call state updated after accept:', {
      isCallAnswered: true,
      isCalling: true,
      timestamp: new Date().toISOString()
    });
  });

  call.on('reject', () => {
    console.log('Incoming call rejected:', { 
      callSid, 
      from: phoneNumber,
      deviceState: device.state,
      timestamp: new Date().toISOString()
    });
    set({ 
      hasIncomingCall: false,
      incomingCallData: null,
      isCalling: false
    });
  });

  // Add the cancel listener
  call.on('cancel', handleCancel);

  call.on('error', (error: Error) => {
    console.error('Call error:', { 
      callSid, 
      from: phoneNumber, 
      error,
      deviceState: device.state,
      timestamp: new Date().toISOString()
    });
    set({ 
      hasIncomingCall: false,
      incomingCallData: null,
      connectionError: `Call error: ${error.message || 'Unknown error'}`,
      isCalling: false
    });
  });

  // Update state to show incoming call
  set({ 
    hasIncomingCall: true,
    incomingCallData: { 
      from: phoneNumber,  // Use the actual phone number here
      callSid: callSid || '',
      callerName: callerName,  // Use the formatted name here
      callerType: 'member'  // You can adjust this based on your logic
    },
    currentCall: call,
    isCalling: true
  });

  console.log('Initial call state set:', {
    hasIncomingCall: true,
    isCalling: true,
    phoneNumber,
    callerName,
    callSid,
    timestamp: new Date().toISOString()
  });
};

type CallState = {
  device: Device | null;
  currentCall: Call | null;
  isCalling: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  callStartTime: number | null;
  callDuration: number;
  callDurationInterval: NodeJS.Timeout | null;
  isCallAnswered: boolean;
  hasIncomingCall: boolean;
  incomingCallData: { 
    from: string; 
    callSid: string;
    callerName?: string;
    callerType?: 'prospect' | 'member';
  } | null;
  currentProspectName: string | null;
  initDevice: (token: string) => Promise<void>;
  makeCall: (params?: Record<string, string>) => void;
  endCall: () => void;
  retryConnection: () => void;
  sendDigit: (digit: string) => void;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
};

export const useCallStore = create<CallState>((set, get) => ({
  device: null,
  currentCall: null,
  isCalling: false,
  isConnecting: false,
  connectionError: null,
  callStartTime: null,
  callDuration: 0,
  callDurationInterval: null,
  isCallAnswered: false,
  hasIncomingCall: false,
  incomingCallData: null,
  currentProspectName: null,

  initDevice: async (token: string) => {
    console.log('Initializing Twilio Device with token:', {
      tokenPrefix: token.substring(0, 10) + '...',
      tokenLength: token.length,
      timestamp: new Date().toISOString()
    });
    set({ isConnecting: true, connectionError: null });
    
    try {
      // Destroy existing device if any
      const existingDevice = get().device;
      if (existingDevice) {
        console.log('Destroying existing device');
        existingDevice.destroy();
      }

      const device = new Device(token, {
        codecPreferences: ['opus', 'pcmu'],
        enableRingingState: true,
        fakeLocalDTMF: true,
        enableIceRestart: true,
        rtcConfiguration: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        },
        allowIncomingWhileBusy: true,
        closeProtection: true,
        debug: true,
        enableDebugLogging: true,
        incomingTimeout: 30
      } as Device.Options);

      console.log('Device object created successfully', {
        tokenLength: token.length,
        deviceState: device.state,
        deviceIdentity: device.identity,
        timestamp: new Date().toISOString()
      });
      
      // Set up registration retry
      let registrationAttempts = 0;
      const maxRegistrationAttempts = 3;
      
      const attemptRegistration = async () => {
        if (device.state !== 'registered' && registrationAttempts < maxRegistrationAttempts) {
          console.log(`Attempting device registration (attempt ${registrationAttempts + 1})`, {
            currentState: device.state,
            attempts: registrationAttempts + 1,
            maxAttempts: maxRegistrationAttempts,
            timestamp: new Date().toISOString()
          });
          
          try {
            await device.register();
            console.log('Device registration request sent', {
              deviceState: device.state,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error('Registration attempt failed:', {
              error,
              attempt: registrationAttempts + 1,
              deviceState: device.state,
              timestamp: new Date().toISOString()
            });
          }
          registrationAttempts++;
        }
      };

      device.on('ready', async () => {
        console.log('Twilio Device Ready event triggered', {
          deviceState: device.state,
          deviceIsRegistered: device.state === 'registered',
          deviceIdentity: device.identity,
          timestamp: new Date().toISOString()
        });
        
        // Attempt registration if not registered
        if (device.state !== 'registered') {
          await attemptRegistration();
        }
        
        set({ isConnecting: false, connectionError: null });
      });
      
      device.on('registered', () => {
        console.log('Twilio Device Registered event triggered', {
          deviceState: device.state,
          deviceIdentity: device.identity,
          registrationAttempts,
          timestamp: new Date().toISOString()
        });
        set({ isConnecting: false, connectionError: null });
      });
      
      device.on('unregistered', async () => {
        console.log('Twilio Device Unregistered event triggered', {
          deviceState: device.state,
          deviceIdentity: device.identity,
          registrationAttempts,
          timestamp: new Date().toISOString()
        });
        // Attempt re-registration
        await attemptRegistration();
      });

      device.on('error', (err) => {
        console.error('Twilio Device Error:', {
          error: err,
          errorDetails: JSON.stringify(err, null, 2),
          deviceState: device.state,
          deviceIdentity: device.identity,
          timestamp: new Date().toISOString()
        });
        
        // Handle specific error types
        if (err.code === 31005) {
          set({ 
            connectionError: 'Connection to Twilio was lost. Please check your internet connection.',
            isConnecting: false 
          });
          // Attempt re-registration on connection loss
          attemptRegistration();
        } else {
          set({ 
            connectionError: `Error: ${err.message || 'Unknown error occurred'}`,
            isConnecting: false 
          });
        }
      });
      
      device.on('disconnect', () => {
        console.log('Twilio Device Disconnect event triggered', {
          deviceState: device.state,
          deviceIsRegistered: device.state === 'registered'
        });
        const state = get();
        // Clear call-related state
        set({ 
          isCalling: false, 
          currentCall: null,
          callStartTime: null,
          callDuration: 0,
          isCallAnswered: false,
          connectionError: null,
          callDurationInterval: null,
          hasIncomingCall: false,
          incomingCallData: null
        });
        
        // Stop the duration timer if it exists
        if (state.callDurationInterval) {
          clearInterval(state.callDurationInterval);
          set({ callDurationInterval: null });
        }
      });
      
      device.on('incoming', async (call) => {
        console.log('Incoming call received:', {
          from: call.parameters?.From,
          callSid: call.parameters?.CallSid,
          parameters: call.parameters,
          deviceState: device.state,
          deviceIsRegistered: device.state === 'registered',
          deviceIdentity: device.identity,
          timestamp: new Date().toISOString()
        });

        // Get caller information from parameters
        const firstName = call.parameters?.FirstName || '';
        const lastName = call.parameters?.LastName || '';
        const callerName = firstName && lastName 
          ? `${firstName} ${lastName}`.trim()
          : firstName || call.parameters?.From || 'Unknown Caller';

        // Determine if it's a prospect or member based on the name format
        const callerType = firstName.includes('College') ? 'prospect' : 'member';

        // Set isCalling and caller info
        set({ 
          isCalling: true,
          hasIncomingCall: true,
          incomingCallData: { 
            from: call.parameters?.From || 'Unknown', 
            callSid: call.parameters?.CallSid || '',
            callerName,
            callerType
          }
        });

        console.log('Call state updated:', {
          isCalling: true,
          hasIncomingCall: true,
          from: call.parameters?.From,
          callerName,
          callerType,
          timestamp: new Date().toISOString()
        });

        // Ensure device is registered before proceeding
        if (device.state !== 'registered') {
          console.log('Device not registered, attempting registration before accepting call');
          await attemptRegistration();
          // Wait briefly for registration
          setTimeout(() => {
            if (device.state === 'registered') {
              handleIncomingCallSetup(device, call, set, get);
            } else {
              console.error('Failed to register device for incoming call');
              call.reject();
              // Reset call state
              set({ 
                isCalling: false,
                hasIncomingCall: false,
                incomingCallData: null
              });
            }
          }, 1000);
          return;
        }

        handleIncomingCallSetup(device, call, set, get);
      });
      
      device.on('tokenWillExpire', () => {
        console.log('Token will expire soon. Requesting new token...');
        // Here you should implement logic to get a new token
        // and call device.updateToken(newToken)
      });

      // Immediately attempt first registration
      await attemptRegistration();

      set({ device });
      console.log('Device state updated in store', {
        deviceState: device.state,
        deviceIdentity: device.identity,
        registrationAttempts,
        timestamp: new Date().toISOString()
      });
    } catch (error: unknown) {
      console.error('Error creating Twilio Device:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ 
        connectionError: `Failed to initialize Twilio device: ${errorMessage}`,
        isConnecting: false 
      });
    }
  },

  acceptIncomingCall: () => {
    const { currentCall, incomingCallData } = get();
    if (currentCall) {
      console.log('Accepting incoming call');
      currentCall.accept();
      // Keep isCalling true when accepting the call and maintain caller info
      set({ 
        isCallAnswered: true,
        hasIncomingCall: false,
        isCalling: true,
        // Keep the existing incomingCallData
        incomingCallData: incomingCallData
      });
    } else {
      console.warn('No incoming call to accept');
    }
  },

  rejectIncomingCall: () => {
    const { currentCall } = get();
    if (currentCall) {
      console.log('Rejecting incoming call');
      currentCall.reject();
      set({ 
        currentCall: null,
        hasIncomingCall: false,
        incomingCallData: null
      });
    } else {
      console.warn('No incoming call to reject');
    }
  },

  makeCall: (params = {}) => {
    console.log('Making call with params:', params);
    const { device } = get();
    if (!device) {
      console.error('Cannot make call: Device is not initialized');
      set({ connectionError: 'Device not initialized. Please try again.' });
      return;
    }

    set({ isCalling: true, connectionError: null });
    try {
      const callPromise = device.connect({ params });
      console.log("Call Promise:", callPromise);
      
      // Handle the promise resolution
      callPromise.then((call: Call) => {

        call.on('accept', () => {
          console.log('Call accepted — user answered');
          
          const startTime = Date.now();
          const durationInterval = setInterval(() => {
            const duration = Math.floor((Date.now() - startTime) / 1000);
            set({ callDuration: duration });
          }, 1000);
        
          set({ 
            currentCall: call,
            callStartTime: startTime,
            callDurationInterval: durationInterval,
            isCallAnswered: true,
            isCalling: true, // Ensure the dialer shows active
          });
        });
        console.log("Call established:", call);
        console.log("Full call object inspection:", {
          parameters: call.parameters,
          customParameters: call.customParameters,
          callProperties: {
            parameters: call.parameters,
            customParameters: call.customParameters?.get('CallSid'),
            outboundConnectionId: call.outboundConnectionId
          }
        });
        
        // Get the call SID from the call object
        const callSid = call.customParameters?.get('CallSid') || call.parameters?.CallSid;
        console.log('Attempting to access Call SID:', {
          callSid,
          fromCustomParams: call.customParameters?.get('CallSid'),
          fromParameters: call.parameters?.CallSid,
          hasCustomParams: !!call.customParameters,
          hasParameters: !!call.parameters,
        });
        
        if (callSid) {
          console.log('Setting up Firebase listener for call:', callSid);
          
          // Add retry mechanism for document not found
          let retryCount = 0;
          const maxRetries = 5;
          const retryInterval = 1000; // 1 second

          const setupListener = () => {
            // Set up a listener for the call document
            const unsubscribe = onSnapshot(
              doc(collection(db, 'calls'), callSid),
              (docSnapshot: DocumentSnapshot<DocumentData>) => {
                console.log('Firebase listener triggered for call:', callSid);
                console.log('Document exists:', docSnapshot.exists());
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
                  console.log('Call status data:', data);
                  if (data?.status === 'answered' || data?.status === 'in-progress') {
                    console.log('Call is answered, starting timer');
                    // Call is answered, start the timer
                    const startTime = Date.now();
                    const durationInterval = setInterval(() => {
                      const duration = Math.floor((Date.now() - startTime) / 1000);
                      set({ callDuration: duration });
                    }, 1000);

                    set({ 
                      currentCall: call, 
                      callStartTime: startTime,
                      callDurationInterval: durationInterval,
                      isCallAnswered: true
                    });
                  } else if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'busy' || data?.status === 'no-answer' || data?.status === 'canceled') {
                    console.log('Call ended with status:', data?.status);
                    // Call ended, clear the timer
                    const state = get();
                    if (state.callDurationInterval) {
                      clearInterval(state.callDurationInterval);
                      set({ callDurationInterval: null });
                    }
                    // Hide the dialer when call is completed
                    set({ isCalling: false, isCallAnswered: false });
                  } else {
                    console.log('Call status update:', data?.status);
                  }
                } else {
                  console.log('No document found for call:', callSid, 'Retry count:', retryCount);
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying in ${retryInterval}ms (Attempt ${retryCount}/${maxRetries})`);
                    setTimeout(() => {
                      unsubscribe();
                      setupListener();
                    }, retryInterval);
                  } else {
                    console.log('Max retries reached, giving up on finding document');
                  }
                }
              },
              (error: Error) => {
                console.error('Error in Firebase listener:', error);
                console.error('Error details:', {
                  message: error.message,
                  stack: error.stack,
                  callSid,
                  retryCount
                });
                
                // Retry on error if we haven't exceeded max retries
                if (retryCount < maxRetries) {
                  retryCount++;
                  console.log(`Error occurred, retrying in ${retryInterval}ms (Attempt ${retryCount}/${maxRetries})`);
                  setTimeout(() => {
                    unsubscribe();
                    setupListener();
                  }, retryInterval);
                }
              }
            );

            // Store the unsubscribe function to clean up later
            call.on('disconnect', () => {
              console.log('Call disconnected, cleaning up Firebase listener for call:', callSid);
              unsubscribe();
              
              // Reset call state when call is disconnected
              const state = get();
              if (state.callDurationInterval) {
                clearInterval(state.callDurationInterval);
              }
              
              set({ 
                isCalling: false, 
                currentCall: null,
                callStartTime: null,
                callDuration: 0,
                callDurationInterval: null,
                isCallAnswered: false,
                connectionError: null
              });
            });
          };

          // Start the initial listener setup
          setupListener();
        } else {
          console.warn('No Call SID found. Full call details:', {
            customParameters: Array.from(call.customParameters?.entries() || []),
            parameters: call.parameters,
            outboundConnectionId: call.outboundConnectionId
          });
          
          // Try using outbound connection ID as fallback
          const fallbackId = call.outboundConnectionId;
          if (fallbackId) {
            console.log('Using outbound connection ID as fallback:', fallbackId);
            const unsubscribe = onSnapshot(
              doc(collection(db, 'calls'), fallbackId),
              (docSnapshot: DocumentSnapshot<DocumentData>) => {
                console.log('Firebase listener triggered for fallback:', fallbackId);
                console.log('Document exists:', docSnapshot.exists());
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
                  console.log('Call status data:', data);
                  if (data?.status === 'answered' || data?.status === 'in-progress') {
                    console.log('Call is answered, starting timer');
                    // Call is answered, start the timer
                    const startTime = Date.now();
                    const durationInterval = setInterval(() => {
                      const duration = Math.floor((Date.now() - startTime) / 1000);
                      set({ callDuration: duration });
                    }, 1000);

                    set({ 
                      currentCall: call, 
                      callStartTime: startTime,
                      callDurationInterval: durationInterval 
                    });
                  } else if (data?.status === 'completed' || data?.status === 'failed' || data?.status === 'busy' || data?.status === 'no-answer' || data?.status === 'canceled') {
                    console.log('Call ended with status:', data?.status);
                    // Call ended, clear the timer
                    const state = get();
                    if (state.callDurationInterval) {
                      clearInterval(state.callDurationInterval);
                      set({ callDurationInterval: null });
                    }
                  } else {
                    console.log('Call status update:', data?.status);
                  }
                } else {
                  console.log('No document found for fallback:', fallbackId);
                  console.log('Checking Firestore path:', `calls/${fallbackId}`);
                }
              },
              (error: Error) => {
                console.error('Error in Firebase listener:', error);
                console.error('Error details:', {
                  message: error.message,
                  stack: error.stack,
                  fallbackId
                });
              }
            );

            // Store the unsubscribe function to clean up later
            call.on('disconnect', () => {
              console.log('Call disconnected, cleaning up Firebase listener for fallback:', fallbackId);
              unsubscribe();
              set({ 
                isCalling: false, 
                currentCall: null,
                callStartTime: null,
                callDuration: 0,
                callDurationInterval: null,
                isCallAnswered: false,
                connectionError: null
              });
            });
          }
        }

      }).catch((error: unknown) => {
        console.error('Error establishing call:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        set({ 
          isCalling: false,
          connectionError: `Failed to establish call: ${errorMessage}`,
          currentCall: null,
          callStartTime: null,
          callDuration: 0
        });
      });
    } catch (error: unknown) {
      console.error('Error making call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ 
        isCalling: false,
        connectionError: `Failed to make call: ${errorMessage}`,
        currentCall: null,
        callStartTime: null,
        callDuration: 0
      });
    }
  },

  endCall: () => {
    const { device, currentCall, callDurationInterval } = get();
    if (device) {
      if (currentCall) {
        currentCall.disconnect();
      } else {
        device.disconnectAll();
      }
      
      // Clear the timer if it exists
      if (callDurationInterval) {
        clearInterval(callDurationInterval);
      }
      
      set({ 
        isCalling: false, 
        connectionError: null,
        currentCall: null,
        callStartTime: null,
        callDuration: 0,
        callDurationInterval: null,
        isCallAnswered: false,
        currentProspectName: null
      });
    }
  },

  sendDigit: (digit: string) => {
    const { currentCall } = get();
    if (currentCall) {
      console.log('Sending DTMF digit:', digit);
      currentCall.sendDigits(digit);
    } else {
      console.warn('Cannot send digit: No active call');
    }
  },

  retryConnection: () => {
    const { device } = get();
    if (device) {
      // Attempt to re-establish the connection
      device.destroy();
      set({ 
        device: null, 
        connectionError: null,
        currentCall: null,
        callStartTime: null,
        callDuration: 0
      });
      // Note: You'll need to implement logic to get a new token
      // and call initDevice with the new token
    }
  },
}));

