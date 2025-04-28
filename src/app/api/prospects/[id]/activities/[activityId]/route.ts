import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { ActivityType, ActivityStatus } from '@/types/activity';

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

// PUT /api/prospects/[id]/activities/[activityId] - Update an activity
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, activityId } = await context.params;
    const body = await request.json();

    if (!id || !ObjectId.isValid(id) || !activityId || !ObjectId.isValid(activityId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    // Validate activity type if provided
    if (body.type && !Object.values(ActivityType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (body.status && !Object.values(ActivityStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid activity status' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const activities = db.collection('activities');

    // First verify the activity belongs to this prospect
    const activity = await activities.findOne({
      _id: new ObjectId(activityId),
      prospectId: new ObjectId(id)
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
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

    const result = await activities.updateOne(
      {
        _id: new ObjectId(activityId),
        prospectId: new ObjectId(id)
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Activity not found or not updated' },
        { status: 404 }
      );
    }

    const updatedActivity = await activities.findOne({
      _id: new ObjectId(activityId),
      prospectId: new ObjectId(id)
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    );
  }
}

// DELETE /api/prospects/[id]/activities/[activityId] - Delete an activity (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; activityId: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, activityId } = await context.params;

    if (!id || !ObjectId.isValid(id) || !activityId || !ObjectId.isValid(activityId)) {
      return NextResponse.json(
        { error: 'Invalid IDs' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const activities = db.collection('activities');

    // First verify the activity belongs to this prospect
    const activity = await activities.findOne({
      _id: new ObjectId(activityId),
      prospectId: new ObjectId(id)
    });

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await activities.updateOne(
      { _id: new ObjectId(activityId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Activity deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    );
  }
}
