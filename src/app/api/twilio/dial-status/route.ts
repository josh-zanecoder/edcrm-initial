import twilio from 'twilio';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const dialCallStatus = formData.get('DialCallStatus') as string;
    const callSid = formData.get('CallSid') as string;

    console.log('Dial ended with status:', dialCallStatus);
    console.log('Call SID:', callSid);

    const twiml = new twilio.twiml.VoiceResponse();

    // Handle different dial outcomes
    switch (dialCallStatus) {
      case 'no-answer':
        twiml.say(
          { voice: 'alice', language: 'en-US' },
          'Sorry, but no one is available to take your call at the moment. Please try again later.'
        );
        break;
      
      case 'failed':
        twiml.say(
          { voice: 'alice', language: 'en-US' },
          'We encountered a problem connecting your call. Please try again.'
        );
        break;
      
      case 'busy':
        twiml.say(
          { voice: 'alice', language: 'en-US' },
          'All our agents are currently busy. Please try calling back in a few minutes.'
        );
        break;
      
      case 'canceled':
        twiml.say(
          { voice: 'alice', language: 'en-US' },
          'The call was canceled. Goodbye.'
        );
        break;
      
      default:
        // For any other status, just hang up gracefully
        twiml.say(
          { voice: 'alice', language: 'en-US' },
          'Thank you for calling. Goodbye.'
        );
    }

    // Add a brief pause before hanging up
    twiml.pause({ length: 1 });
    twiml.hangup();

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('Error handling dial status:', err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(
      { voice: 'alice', language: 'en-US' },
      'We apologize, but an error occurred. Please try again later.'
    );
    twiml.hangup();
    
    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
} 