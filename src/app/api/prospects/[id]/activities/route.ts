import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';
import connectToMongoDB from '@/lib/mongoose';
import Activity from '@/models/Activity';
import Prospect from '@/models/Prospect';
import { ActivityType, ActivityStatus } from '@/types/activity';

const getUserCookie = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('user');
};

// GET /api/prospects/[id]/activities
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    const prospectExists = await Prospect.exists({ _id: id });
    if (!prospectExists) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const activities = await Activity.find({ prospectId: id, isActive: true }).lean();

    const formattedActivities = activities.map(activity => ({
      ...activity,
      _id: (activity._id as mongoose.Types.ObjectId).toString(),
      prospectId: activity.prospectId?.toString() || null,
      addedBy: activity.addedBy?.toString() || null,
      dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString() : null,
      completedAt: activity.completedAt ? new Date(activity.completedAt).toISOString() : null,
      createdAt: activity.createdAt?.toISOString() || null,
      updatedAt: activity.updatedAt?.toISOString() || null
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST /api/prospects/[id]/activities
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const userCookie = await getUserCookie();

    const { id } = await context.params;
    const body = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    if (!body.title || !body.description || !body.type || !body.status || !body.dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Object.values(ActivityType).includes(body.type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    if (!Object.values(ActivityStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid activity status' }, { status: 400 });
    }

    let userId: string;
    try {
      const userData = JSON.parse(userCookie?.value || '');
      userId = userData.id;
    } catch (err) {
      console.error('Invalid user cookie:', err);
      return NextResponse.json({ error: 'Invalid user data in cookie' }, { status: 400 });
    }

    const prospectExists = await Prospect.exists({ _id: id });
    if (!prospectExists) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const activity = new Activity({
      prospectId: id,
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status,
      dueDate: new Date(body.dueDate),
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      isActive: true,
      addedBy: userId
    });

    const saved = await activity.save();

    const formatted = {
      ...saved.toObject(),
      _id: saved._id.toString(),
      prospectId: saved.prospectId.toString(),
      addedBy: saved.addedBy.toString(),
      dueDate: saved.dueDate.toISOString(),
      completedAt: saved.completedAt?.toISOString() || null,
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString()
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
