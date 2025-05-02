import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import connectToMongoDB from '@/lib/mongoose';
import Reminder from '@/models/Reminder';
import { ReminderType, ReminderStatus } from '@/types/reminder';


// PUT /api/prospects/[id]/reminders/[reminderId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    await connectToMongoDB();


    const { id, reminderId } = await context.params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reminderId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    if (body.type && !Object.values(ReminderType).includes(body.type)) {
      return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 });
    }

    if (body.status && !Object.values(ReminderStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid reminder status' }, { status: 400 });
    }

    const reminder = await Reminder.findOne({
      _id: reminderId,
      prospectId: id,
      isActive: true
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    // Apply allowed updates
    if (body.title) reminder.title = body.title;
    if (body.description) reminder.description = body.description;
    if (body.type) reminder.type = body.type;
    if (body.status) reminder.status = body.status;
    if (body.dueDate) reminder.dueDate = new Date(body.dueDate);
    if (body.completedAt) reminder.completedAt = new Date(body.completedAt);

    reminder.updatedAt = new Date();

    const updated = await reminder.save();

    const formatted = {
      ...updated.toObject(),
      _id: updated._id.toString(),
      prospectId: updated.prospectId.toString(),
      addedBy: updated.addedBy.toString(),
      dueDate: updated.dueDate.toISOString(),
      completedAt: updated.completedAt?.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
  }
}

// DELETE /api/prospects/[id]/reminders/[reminderId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    await connectToMongoDB();


    const { id, reminderId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(reminderId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const reminder = await Reminder.findOne({
      _id: reminderId,
      prospectId: id,
      isActive: true
    });

    if (!reminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 });
    }

    reminder.isActive = false;
    reminder.updatedAt = new Date();

    await reminder.save();

    return NextResponse.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
