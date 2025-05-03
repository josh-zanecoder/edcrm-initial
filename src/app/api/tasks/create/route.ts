export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createTranscriptionTask } from '@/lib/cloud-tasks';

export async function POST(req: Request) {
  try {
    const { recordingUrl, callSid } = await req.json();
    const response = await createTranscriptionTask(recordingUrl, callSid);
    return NextResponse.json({ success: true, taskName: response.name });
  } catch (error) {
    console.error('Error creating Cloud Task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 