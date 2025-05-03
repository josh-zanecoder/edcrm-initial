import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin'; // Import the Firebase Admin initialization
import connectToMongoDB from '@/lib/mongoose';

const db = getFirestore();

// POST endpoint to handle Twilio recording status callbacks
export async function POST(req: Request) {
  try {
    // Connect to MongoDB first
    await connectToMongoDB();
    
    const formData = await req.formData();
    
    // Extract recording information from the callback
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log(`Recording ${recordingSid} for call ${callSid} is ${recordingStatus}`);
    console.log(`Recording URL: ${recordingUrl}`);
    
    // If recording is completed, create a Cloud Task for transcription
    if (recordingStatus === "completed") {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ recordingUrl, callSid }),
        });

        if (!response.ok) {
          throw new Error('Failed to create transcription task');
        }

        console.log('Created transcription task successfully');
      } catch (error) {
        console.error('Error creating transcription task:', error);
      }
    }

    // Store the recording information in Firestore
    await db.collection('calls').doc(callSid).set(
      {
        recordingStatus,
        recordingUrl,
        recordingSid,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error processing recording status callback:', err);
    return NextResponse.json(
      { error: 'Failed to process recording status callback' },
      { status: 500 }
    );
  }
} 