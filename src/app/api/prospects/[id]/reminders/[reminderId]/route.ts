import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ReminderType, ReminderStatus } from '@/types/reminder';

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

// PUT /api/prospects/[id]/reminders/[reminderId] - Update a reminder
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, reminderId } = await context.params;
    const body = await request.json();

    if (!id || !ObjectId.isValid(id) || !reminderId || !ObjectId.isValid(reminderId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // Validate reminder type if provided
    if (body.type && !Object.values(ReminderType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid reminder type' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(ReminderStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid reminder status' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const reminders = db.collection('reminders');

    // First verify the reminder belongs to this prospect
    const reminder = await reminders.findOne({
      _id: new ObjectId(reminderId),
      prospectId: new ObjectId(id)
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Convert dueDate to Date if provided
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.addedBy;
    delete updateData.prospectId;

    const result = await reminders.updateOne(
      {
        _id: new ObjectId(reminderId),
        prospectId: new ObjectId(id)
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Reminder not found or not updated' },
        { status: 404 }
      );
    }

    const updatedReminder = await reminders.findOne({
      _id: new ObjectId(reminderId),
      prospectId: new ObjectId(id)
    });

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

// DELETE /api/prospects/[id]/reminders/[reminderId] - Delete a reminder (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, reminderId } = await context.params;

    if (!id || !ObjectId.isValid(id) || !reminderId || !ObjectId.isValid(reminderId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const reminders = db.collection('reminders');

    // First verify the reminder belongs to this prospect
    const reminder = await reminders.findOne({
      _id: new ObjectId(reminderId),
      prospectId: new ObjectId(id)
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await reminders.updateOne(
      { _id: new ObjectId(reminderId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete reminder' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Reminder deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
} 