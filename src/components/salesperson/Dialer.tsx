import { useState, useEffect } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { PhoneIcon } from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/outline';

interface DialerProps {
  initialPhoneNumber?: string;
  callerName?: string;
}

export default function Dialer({ initialPhoneNumber, callerName }: DialerProps) {
  const { makeCall, endCall, isCalling, sendDigit, callDuration, isCallAnswered } = useCallStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');

  useEffect(() => {
    if (initialPhoneNumber) {
      const digits = initialPhoneNumber.replace(/\D/g, '');
      setPhoneNumber(digits);
      setFormattedNumber(formatPhoneNumber(digits));
    }
  }, [initialPhoneNumber]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return `+${digits}`;
  };

  const handleNumberClick = (digit: string) => {
    if (isCalling) {
      sendDigit(digit);
    } else if (phoneNumber.length < 12) {
      const newNumber = phoneNumber + digit;
      setPhoneNumber(newNumber);
      setFormattedNumber(formatPhoneNumber(newNumber));
    }
  };

  const handleCall = () => {
    if (phoneNumber.length >= 10) {
      makeCall({
        To: `+${phoneNumber}`,
        CallerId: '+16196044956'
      });
    }
  };

  const handleEndCall = () => {
    endCall();
    setPhoneNumber('');
    setFormattedNumber('');
  };

  return (
    <div className="w-[320px] bg-black rounded-[32px] overflow-hidden shadow-2xl">
      {/* Display */}
      <div className="pt-10 pb-6 px-6">
        <div className="text-center">
          <div className="text-[24px] text-white mb-1 font-medium">
            {callerName || 'UNKNOWN'}
          </div>
          <div className="text-[18px] text-white/80 mb-1">
            {formattedNumber || '+16196044956'}
          </div>
          <div className="text-[16px] text-white/60 mt-2">
            {isCalling ? (
              <>
                {isCallAnswered ? (
                  <span className="text-green-400">Connected • {formatTime(callDuration)}</span>
                ) : (
                  <span className="text-yellow-400">Calling...</span>
                )}
              </>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-6 px-6 py-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'home', 0, 'back'].map((digit) => (
          <button
            key={digit}
            onClick={() => typeof digit === 'number' && handleNumberClick(digit.toString())}
            className="h-[64px] w-[64px] mx-auto flex items-center justify-center rounded-full
              bg-[#2C3440] hover:bg-[#374151] active:bg-[#4B5563]
              transition-all duration-150"
          >
            {digit === 'home' ? (
              <HomeIcon className="h-6 w-6 text-white" />
            ) : digit === 'back' ? (
              <div className="rotate-135">
                <PhoneIcon className="h-6 w-6 text-white" />
              </div>
            ) : (
              <span className="text-[28px] text-white font-normal">
                {digit}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Call Button */}
      <div className="px-6 pb-10 pt-4 flex justify-center">
        <button
          onClick={isCalling ? handleEndCall : handleCall}
          className="w-[64px] h-[64px] rounded-full flex items-center justify-center 
            bg-red-500 hover:bg-red-600
            transition-all duration-150"
        >
          <PhoneIcon 
            className="h-6 w-6 text-white" 
          />
        </button>
      </div>
    </div>
  );
} 