import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Activity, ActivityType, ActivityStatus } from '@/types/activity';

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

// GET /api/prospects/[id]/activities - Get all activities for a prospect
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid prospect ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const activities = db.collection('activities');

    // Get all active activities for this prospect
    const activitiesList = await activities
      .find({
        prospectId: new ObjectId(id),
        isActive: true
      })
      .toArray();

    return NextResponse.json(activitiesList);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// POST /api/prospects/[id]/activities - Create a new activity
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid prospect ID' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title || !body.description || !body.type || !body.status || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate activity type
    if (!Object.values(ActivityType).includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(ActivityStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid activity status' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const activities = db.collection('activities');

    const user = JSON.parse(userCookie.value);
    const newActivity = {
      ...body,
      prospectId: new ObjectId(id),
      dueDate: new Date(body.dueDate),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      addedBy: new ObjectId(user._id)
    };

    const result = await activities.insertOne(newActivity);

    if (!result.insertedId) {
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    const createdActivity = await activities.findOne({ _id: result.insertedId });

    if (!createdActivity) {
      return NextResponse.json(
        { error: 'Failed to fetch created activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(createdActivity);
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
} 