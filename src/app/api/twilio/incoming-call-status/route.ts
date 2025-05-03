import { ObjectId } from 'mongodb';
import Member from '@/models/Member';
import Prospect from '@/models/Prospect';
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getFirestore } from 'firebase-admin/firestore';
import '@/lib/firebase-admin';
import { unformatPhoneNumber } from '@/utils/formatters';
import { SalesPersonModel } from '@/models/SalesPerson';

const db = getFirestore();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    // Log the call status update
    console.log(`Call Status Update:
      CallSid: ${callSid}
      Status: ${callStatus}
      From: ${from}
      To: ${to}
      Timestamp: ${new Date().toISOString()}
      Is Answer Event: ${callStatus === 'answered' || callStatus === 'in-progress'}
      Is Call Ended: ${callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'canceled'}
    `);

    // Store the call status in Firestore with additional metadata
    await db.collection('calls').doc(callSid).set(
      {
        status: callStatus,
        from,
        to,
        updatedAt: new Date().toISOString(),
        isAnswerEvent: callStatus === 'answered' || callStatus === 'in-progress',
        isCallEnded: callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'canceled',
        callDirection: 'incoming',
        statusHistory: {
          [new Date().toISOString()]: callStatus
        },
        lastStatusUpdate: new Date().toISOString(),
        statusDuration: callStatus === 'ringing' ? 0 : null,
        isRinging: callStatus === 'ringing',
        isAnswered: callStatus === 'answered' || callStatus === 'in-progress',
        isCompleted: callStatus === 'completed',
        isFailed: callStatus === 'failed',
        isNoAnswer: callStatus === 'no-answer',
        isBusy: callStatus === 'busy',
        isCanceled: callStatus === 'canceled'
      },
      { merge: true }
    );

    // Get MongoDB client
    const client = await clientPromise;
    const mongoDb = client.db();

    // Find the member/prospect
    const member = await Prospect.findOne({ phone: unformatPhoneNumber(from) }) ?? await Member.findOne({ phone: unformatPhoneNumber(from) });
    const salesPerson = await SalesPersonModel.findOne({ phone: unformatPhoneNumber(to) })
    if (member) {
      // Check if call log already exists
      const existingCallLog = await mongoDb.collection('calllogs').findOne({ callSid });
      
      if (!existingCallLog) {
        // Create a new activity
        const newActivity = {
          title: `Call from ${member.firstName || member.collegeName}`,
          description: `Incoming call from ${member.firstName + member.lastname || member.collegeName} to ${salesPerson ? `${salesPerson.first_name} ${salesPerson.last_name}` : 'Unknown'}`,
          type: 'CALL',
          status: 'COMPLETED',
          dueDate: new Date(),
          completedAt: new Date(),
          prospectId: new ObjectId(member.prospectId),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const activityResult = await mongoDb.collection('activities').insertOne(newActivity);
        const newActivityId = activityResult.insertedId.toString();
      
        // Create new call log
        const newCallLog = {
          to: to,
          from: from,
          callSid: callSid,
          prospectId: new member.prospectId,
          activityId: new ObjectId(newActivityId),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await mongoDb.collection('calllogs').insertOne(newCallLog);
      } else {
        console.log(`Call log already exists for call ${callSid}`);
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error processing call status update:', error);
    return new NextResponse('Error processing call status update', { status: 500 });
  }
}
