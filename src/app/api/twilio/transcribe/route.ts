import { NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/openai';
import { chat } from '@/lib/chat';
import connectToMongoDB from '@/lib/mongoose';
import { CallLog } from '@/models/CallLogs';
import Activity from '@/models/Activity';
import Reminder from '@/models/Reminder';
import { ReminderType, ReminderStatus } from '@/types/reminder';

export async function POST(req: Request) {
  try {
    await connectToMongoDB();
    
    const { recordingUrl, callSid } = await req.json();
    
    if (!recordingUrl || !callSid) {
      return NextResponse.json(
        { error: 'Recording URL and Call SID are required' },
        { status: 400 }
      );
    }

    // Transcribe the audio
    const transcription = await transcribeAudio(recordingUrl);
    console.log('Transcription completed successfully');
    
    // Get summary from chat
    const summary = await chat(transcription);
    const parsedSummary = JSON.parse(summary);
    console.log('This is summary:', parsedSummary);

    // Update MongoDB
    const memberCallLog = await CallLog.findOneAndUpdate(
      { callSid: callSid },
      { $set: { transcription: transcription } },
      { new: true }
    );

    if (!memberCallLog) {
      throw new Error('Call log not found');
    }

    const activity = await Activity.findByIdAndUpdate(
      { _id: memberCallLog.activityId },
      { $set: { description: parsedSummary.summary } },
      { new: true }
    );

    // Create reminders for each todo item
    if (parsedSummary.todos && Array.isArray(parsedSummary.todos)) {
      for (const todo of parsedSummary.todos) {
        const reminder = new Reminder({
          prospectId: memberCallLog.prospectId,
          title: todo.task,
          description: `Task from call with ${memberCallLog.prospectName}: ${todo.task}`,
          type: ReminderType.OTHER,
          status: ReminderStatus.PENDING,
          dueDate: new Date(todo.date),
          isActive: true,
          addedBy: activity.addedBy
        });

        await reminder.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing transcription:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
} 