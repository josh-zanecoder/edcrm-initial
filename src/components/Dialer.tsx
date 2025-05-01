import { useState, useEffect } from 'react';
import { useCallStore } from '@/store/useCallStore';
import { PhoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline';
import { HomeIcon } from '@heroicons/react/24/outline';

interface DialerProps {
  initialPhoneNumber?: string;
  callerName?: string;
}

export default function Dialer({ initialPhoneNumber, callerName: propCallerName }: DialerProps) {
  const { 
    makeCall, 
    endCall, 
    isCalling, 
    sendDigit, 
    callDuration, 
    isCallAnswered,
    incomingCallData,
    hasIncomingCall,
    acceptIncomingCall,
    rejectIncomingCall
  } = useCallStore();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedNumber, setFormattedNumber] = useState('');

  // Determine the display name and number
  const displayName = incomingCallData?.callerName || propCallerName || 'Unknown Caller';
  const callerType = incomingCallData?.callerType;
  const displayNumber = hasIncomingCall ? incomingCallData?.from : (formattedNumber || '+16196044956');

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
    if (isCalling && isCallAnswered) {
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
    if (hasIncomingCall) {
      rejectIncomingCall();
    } else {
      endCall();
    }
    setPhoneNumber('');
    setFormattedNumber('');
  };

  const handleAnswer = () => {
    acceptIncomingCall();
  };

  return (
    <div className="w-[320px] bg-black rounded-[32px] overflow-hidden shadow-2xl">
      {/* Display */}
      <div className="pt-10 pb-6 px-6">
        <div className="text-center">
          <div className="text-[24px] text-white mb-1 font-medium">
            {displayName}
          </div>
          {callerType && (
            <div className="text-[14px] text-white/60 mb-1">
              {callerType === 'prospect' ? 'Prospect' : 'Member'}
            </div>
          )}
          <div className="text-[18px] text-white/80 mb-1">
            {displayNumber}
          </div>
          <div className="text-[16px] text-white/60 mt-2">
            {isCalling ? (
              <>
                {isCallAnswered ? (
                  <span className="text-green-400">Connected • {formatTime(callDuration)}</span>
                ) : (
                  <span className="text-yellow-400">
                    {hasIncomingCall ? 'Incoming Call...' : 'Calling...'}
                  </span>
                )}
              </>
            ) : (
              ''
            )}
          </div>
        </div>
      </div>

      {/* Keypad - Only show when call is answered or no call is in progress */}
      {(!isCalling || isCallAnswered) && (
        <div className="grid grid-cols-3 gap-6 px-6 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handleNumberClick(digit.toString())}
              className="h-[64px] w-[64px] mx-auto flex items-center justify-center rounded-full
                bg-[#2C3440] hover:bg-[#374151] active:bg-[#4B5563]
                transition-all duration-150"
            >
              <span className="text-[28px] text-white font-normal">
                {digit}
              </span>
            </button>
          ))}
          <button
            onClick={() => {}}
            className="h-[64px] w-[64px] mx-auto flex items-center justify-center rounded-full
              bg-[#2C3440] hover:bg-[#374151] active:bg-[#4B5563]
              transition-all duration-150"
          >
            <HomeIcon className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="h-[64px] w-[64px] mx-auto flex items-center justify-center rounded-full
              bg-[#2C3440] hover:bg-[#374151] active:bg-[#4B5563]
              transition-all duration-150"
          >
            <span className="text-[28px] text-white font-normal">
              0
            </span>
          </button>
          <button
            onClick={() => handleNumberClick('*')}
            className="h-[64px] w-[64px] mx-auto flex items-center justify-center rounded-full
              bg-[#2C3440] hover:bg-[#374151] active:bg-[#4B5563]
              transition-all duration-150"
          >
            <span className="text-[28px] text-white font-normal">
              *
            </span>
          </button>
        </div>
      )}

      {/* Call Controls */}
      <div className="px-6 pb-10 pt-4 flex justify-center space-x-4">
        {hasIncomingCall && !isCallAnswered ? (
          <>
            {/* Answer Button */}
            <button
              onClick={handleAnswer}
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center 
                bg-green-500 hover:bg-green-600
                transition-all duration-150"
            >
              <PhoneIcon 
                className="h-6 w-6 text-white" 
              />
            </button>
            {/* Reject Button */}
            <button
              onClick={handleEndCall}
              className="w-[64px] h-[64px] rounded-full flex items-center justify-center 
                bg-red-500 hover:bg-red-600
                transition-all duration-150"
            >
              <PhoneXMarkIcon 
                className="h-6 w-6 text-white" 
              />
            </button>
          </>
        ) : (
          <button
            onClick={isCalling ? handleEndCall : handleCall}
            className={`w-[64px] h-[64px] rounded-full flex items-center justify-center 
              ${isCalling ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
              transition-all duration-150`}
          >
            {isCalling ? (
              <PhoneXMarkIcon className="h-6 w-6 text-white" />
            ) : (
              <PhoneIcon className="h-6 w-6 text-white" />
            )}
          </button>
        )}
      </div>
    </div>
  );
} 