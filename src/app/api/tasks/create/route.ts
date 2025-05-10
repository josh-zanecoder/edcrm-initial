export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createTranscriptionTask } from '@/lib/cloud-tasks';

export async function POST(req: Request) {
  try {
    const { recordingUrl, callSid } = await req.json();

    if (!recordingUrl || !callSid) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const result = await createTranscriptionTask(recordingUrl, callSid);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in task creation:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 