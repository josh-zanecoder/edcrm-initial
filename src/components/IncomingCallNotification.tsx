'use client';

import { useEffect } from 'react';
import { useCallStore } from '@/store/useCallStore';

export function IncomingCallNotification() {
  const { 
    hasIncomingCall, 
    incomingCallData, 
    acceptIncomingCall, 
    rejectIncomingCall 
  } = useCallStore();

  useEffect(() => {
    // Play ringtone when there's an incoming call
    let audio: HTMLAudioElement | null = null;
    
    if (hasIncomingCall) {
      audio = new Audio('/ringtone.mp3'); // Make sure to add a ringtone file to your public folder
      audio.loop = true;
      audio.play().catch(err => console.error('Error playing ringtone:', err));
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [hasIncomingCall]);

  if (!hasIncomingCall || !incomingCallData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Incoming Call</h3>
          <p className="text-gray-600 mb-4">
            From: {incomingCallData.from}
          </p>
          
          <div className="flex justify-center space-x-4">
            {/* Accept Call Button */}
            <button
              onClick={acceptIncomingCall}
              className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <span className="sr-only">Accept Call</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>

            {/* Reject Call Button */}
            <button
              onClick={rejectIncomingCall}
              className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <span className="sr-only">Reject Call</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.13a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 