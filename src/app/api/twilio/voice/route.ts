import { NextResponse } from 'next/server';
import twilio from 'twilio';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

// POST is used because Twilio sends params as form-urlencoded
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string | null;
    const callerId = formData.get('CallerId') as string | null;
		console.log('Call from:', callerId)
    console.log('Received call request to:', to);

    const twiml = new twilio.twiml.VoiceResponse();

    if (!to) {
      twiml.say('Sorry, no destination number provided.');
      return new Response(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Add recording parameters to the dial
    const dial = twiml.dial({ 
      callerId: callerId || '+YOUR_TWILIO_NUMBER',
      record: 'record-from-answer', // Start recording when the call is answered
      recordingStatusCallback: '/api/twilio/recording-status', // Webhook to notify when recording is complete
      recordingStatusCallbackEvent: ['completed'], // Only notify when recording is completed
      recordingStatusCallbackMethod: 'POST', // Use POST method for the callback
    });
    
    // if (/^\+?[1-9]\d{6,14}$/.test(to)) {
      // Dial a phone number
      dial.number({
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        // Note: 'in-progress' is a status that Twilio sends but not an event we can subscribe to
        statusCallback: '/api/twilio/call-status',
        statusCallbackMethod: 'POST'
      },to);
    // } else {
    //   // Dial a client identity
    //   dial.client(to);
    // }

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (err) {
    console.error('Error generating TwiML:', err);
    return NextResponse.json(
      { error: 'Failed to generate TwiML' },
      { status: 500 }
    );
  }
}
