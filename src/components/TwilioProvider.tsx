'use client';

import { useEffect, useState } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { useAuth } from '@/contexts/AuthContext';
import Dialer from '@/components/Dialer';

export default function TwilioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { initDevice, isCalling, incomingCallData } = useCallStore();
  const [twilioError, setTwilioError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setTwilioError(null);
        console.log('Fetching Twilio token...');
        const res = await fetch('/api/twilio/token');
        if (!res.ok) {
          const error = await res.json();
          console.error('Error response from token endpoint:', error);
          throw new Error(error.error || 'Failed to fetch Twilio token');
        }
        const data = await res.json();
        console.log('Twilio token received, initializing device...');
        await initDevice(data.token);
      } catch (error) {
        console.error('Error fetching Twilio token:', error);
        setTwilioError(error instanceof Error ? error.message : 'Failed to initialize Twilio');
      }
    };

    if (user) {
      fetchToken();
    }
  }, [user, initDevice]);

  if (twilioError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Twilio Error</h3>
            <div className="mt-2 text-sm text-red-700">{twilioError}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      {isCalling && (
        <div className="fixed bottom-8 right-8 z-50">
          <Dialer 
            callerName={incomingCallData?.callerName || "Unknown"} 
            initialPhoneNumber={incomingCallData?.from}
          />
        </div>
      )}
    </>
  );
} 