import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import connectToMongoDB from '@/lib/mongoose';
import Activity from '@/models/Activity';
import { ActivityStatus, ActivityType } from '@/types/activity';



// PUT /api/prospects/[id]/activities/[activityId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    await connectToMongoDB();


    const { id, activityId } = await context.params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(activityId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    if (body.type && !Object.values(ActivityType).includes(body.type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    if (body.status && !Object.values(ActivityStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid activity status' }, { status: 400 });
    }

    const activity = await Activity.findOne({
      _id: activityId,
      prospectId: id,
      isActive: true
    });

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    const allowedUpdates = ['title', 'description', 'type', 'status', 'dueDate'];
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        activity[key] = key === 'dueDate' ? new Date(body[key]) : body[key];
      }
    }

    activity.updatedAt = new Date();

    const updatedActivity = await activity.save();
    return NextResponse.json({
      ...updatedActivity.toObject(),
      _id: updatedActivity._id.toString(),
      prospectId: updatedActivity.prospectId.toString(),
      addedBy: updatedActivity.addedBy?.toString() || null,
      dueDate: updatedActivity.dueDate?.toISOString() || null,
      completedAt: updatedActivity.completedAt?.toISOString() || null,
      createdAt: updatedActivity.createdAt.toISOString(),
      updatedAt: updatedActivity.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

// DELETE /api/prospects/[id]/activities/[activityId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    await connectToMongoDB();
    const { id, activityId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(activityId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    const activity = await Activity.findOneAndUpdate(
      { _id: activityId, prospectId: id, isActive: true },
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
