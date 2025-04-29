import { create } from 'zustand';
import { Device, Call } from '@twilio/voice-sdk';
import { onSnapshot, DocumentSnapshot, DocumentData, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  initDevice: (token: string) => void;
  makeCall: (params?: Record<string, string>) => void;
  endCall: () => void;
  retryConnection: () => void;
  sendDigit: (digit: string) => void;
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

  initDevice: (token: string) => {
    console.log('Initializing Twilio Device with token:', token.substring(0, 10) + '...');
    set({ isConnecting: true, connectionError: null });
    
    try {
      const device = new Device(token, {
        codecPreferences: ['opus', 'pcmu'],
        enableRingingState: true,
        fakeLocalDTMF: true,
        // Add edge servers for better connectivity
        edges: ['ashburn', 'dublin', 'singapore'],
        // Add reasonable timeouts
        maxCallSignalingTimeoutMs: 30000,
      } as Device.Options);

      console.log('Device object created successfully');
      
      device.on('ready', () => {
        console.log('Twilio Device Ready event triggered');
        set({ isConnecting: false, connectionError: null });
      });
      
      device.on('error', (err) => {
        console.error('Twilio Device Error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        
        // Handle specific error types
        if (err.code === 31005) {
          set({ 
            connectionError: 'Connection to Twilio was lost. Please check your internet connection.',
            isConnecting: false 
          });
        } else {
          set({ 
            connectionError: `Error: ${err.message || 'Unknown error occurred'}`,
            isConnecting: false 
          });
        }
      });
      
      device.on('disconnect', () => {
        console.log('Twilio Device Disconnect event triggered');
        const state = get();
        // Clear call-related state
        set({ 
          isCalling: false, 
          currentCall: null,
          callStartTime: null,
          callDuration: 0,
          isCallAnswered: false,
          connectionError: null
        });
        
        // Stop the duration timer if it exists
        if (state.callDurationInterval) {
          clearInterval(state.callDurationInterval);
          set({ callDurationInterval: null });
        }
      });
      
      device.on('incoming', () => {
        console.log('Twilio Device Incoming call event triggered');
      });
      
      device.on('registered', () => {
        console.log('Twilio Device Registered event triggered');
        set({ isConnecting: false, connectionError: null });
      });
      
      device.on('unregistered', () => {
        console.log('Twilio Device Unregistered event triggered');
      });
      
      device.on('tokenWillExpire', () => {
        console.log('Token will expire soon. Requesting new token...');
        // Here you should implement logic to get a new token
        // and call device.updateToken(newToken)
      });
      

      set({ device });
      console.log('Device state updated in store');
    } catch (error: unknown) {
      console.error('Error creating Twilio Device:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      set({ 
        connectionError: `Failed to initialize Twilio device: ${errorMessage}`,
        isConnecting: false 
      });
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
                  
                  // You can add additional logic here for when a call is answered
                  // For example, playing a sound, showing a notification, etc.
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
                console.log('No document found for call:', callSid);
                console.log('Checking Firestore path:', `calls/${callSid}`);
              }
            },
            (error: Error) => {
              console.error('Error in Firebase listener:', error);
              console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                callSid
              });
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
        isCallAnswered: false
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

