import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin'; // Import the Firebase Admin initialization

const db = getFirestore();

// POST endpoint to handle Twilio recording status callbacks
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    // Extract recording information from the callback
    const recordingSid = formData.get('RecordingSid') as string;
    const recordingUrl = formData.get('RecordingUrl') as string;
    const recordingStatus = formData.get('RecordingStatus') as string;
    const callSid = formData.get('CallSid') as string;
    
    console.log(`Recording ${recordingSid} for call ${callSid} is ${recordingStatus}`);
    console.log(`Recording URL: ${recordingUrl}`);
    
    // Here you can implement logic to:
    // 1. Store the recording URL in your database
    // 2. Download the recording file
    // 3. Process the recording (transcription, analysis, etc.)
    
    // For now, we'll just log the information
    // In a production environment, you would want to store this in your database
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