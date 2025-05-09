import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import '@/lib/firebase-admin'; // Import Firebase Admin initialization

const db = getFirestore();

// POST endpoint to handle Twilio call status callbacks
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extract call information from the callback
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    
    console.log(`Callssssssssssss ${callSid} status: ${callStatus}`);
    
    // Check if this is an answer event
    const isAnswerEvent = callStatus === 'answered';
    if (isAnswerEvent) {
      console.log(`🔔 CALL ANSWERED: Receiver at ${to} has answered the call from ${from}`);
    }
    
    // Store the call status in Firestore
    await db.collection('calls').doc(callSid).set(
      {
        status: callStatus,
        duration: duration || '0',
        from,
        to,
        updatedAt: new Date().toISOString(),
        // Add a flag to indicate this was an answer event
        isAnswerEvent: isAnswerEvent,
        // Add a flag to indicate if the call is completed/failed to help with UI state
        isCallEnded: callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'canceled',
      },
      { merge: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error processing call status callback:', err);
    return NextResponse.json(
      { error: 'Failed to process call status callback' },
      { status: 500 }
    );
  }
} 