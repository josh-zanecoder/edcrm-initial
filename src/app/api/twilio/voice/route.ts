import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { ObjectId } from 'mongodb';

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

// POST is used because Twilio sends params as form-urlencoded
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string | null;
    const callerId = formData.get('CallerId') as string | null;
    const firstName = formData.get('FirstName') as string | null;
    const lastName = formData.get('LastName') as string | null;
    const prospectId = formData.get('ProspectId') as string;
    const callType = formData.get('CallType') as string | null;
    const from = formData.get('From') as string;
    const callSid = formData.get('CallSid') as string;
    const userId = formData.get('UserId') as string;
    const parentCallSid = formData.get('ParentCallSid') as string;

    console.log('Call details:', {
      to,
      callerId,
      firstName,
      lastName,
      prospectId,
      callType
    });

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
    
    // Dial a phone number with custom parameters
    dial.number({
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      // Note: 'in-progress' is a status that Twilio sends but not an event we can subscribe to
      statusCallback: '/api/twilio/call-status',
      statusCallbackMethod: 'POST'
    }, to);

     // Get MongoDB client
     const client = await clientPromise;
     const mongoDb = client.db();
     let newActivityId = '';
 
    //  // Check if call log already exists in MongoDB
     const existingCallLog = await mongoDb.collection('calllogs').findOne({ callSid });
     
     if (!existingCallLog) {
       // Create a new activity for the call if activityId is not provided
       
       if (!newActivityId) {
         const newActivity = {
           title: `Call to ${to}`,
           description: `Outbound call from ${from} to ${to}`,
           type: 'CALL',
           status: 'COMPLETED',
           dueDate: new Date(),
           completedAt: new Date(),
           prospectId: new ObjectId(prospectId),
           addedBy: userId,
           isActive: true,
           createdAt: new Date(),
           updatedAt: new Date()
         };
         
         const activityResult = await mongoDb.collection('activities').insertOne(newActivity);
         newActivityId = activityResult.insertedId.toString();
       }
       
       // Create new call log with the activity ID
       const newCallLog = {
         to,
         from,
         userId: userId,
         prospectId: new ObjectId(prospectId),
         callSid,
         parentCallSid: parentCallSid || '',
         activityId: new ObjectId(newActivityId),
         createdAt: new Date(),
         updatedAt: new Date()
       };
       
       await mongoDb.collection('calllogs').insertOne(newCallLog);
     } else {
       console.log(`Call log already exists for call ${callSid}`);
     }

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
