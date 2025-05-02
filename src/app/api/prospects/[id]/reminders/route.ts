import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import connectToMongoDB from '@/lib/mongoose';
import Reminder from '@/models/Reminder';
import Prospect from '@/models/Prospect';
import { ReminderType, ReminderStatus } from '@/types/reminder';

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

// GET /api/prospects/[id]/reminders
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

    const reminders = await Reminder.find({
      prospectId: id,
      isActive: true
    }).lean();

    const formattedReminders = reminders.map(reminder => ({
      ...reminder,
      _id: (reminder._id as mongoose.Types.ObjectId).toString(),
      prospectId: (reminder.prospectId as mongoose.Types.ObjectId).toString(),
      addedBy: (reminder.addedBy as mongoose.Types.ObjectId).toString(),
      dueDate: new Date(reminder.dueDate).toISOString(),
      completedAt: reminder.completedAt ? new Date(reminder.completedAt).toISOString() : null,
      createdAt: new Date(reminder.createdAt).toISOString(),
      updatedAt: new Date(reminder.updatedAt).toISOString()
    }));
      
    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// POST /api/prospects/[id]/reminders
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const userCookie = await getCookies();


    const { id } = await context.params;
    const body = await request.json();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    if (!body.title || !body.description || !body.type || !body.dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!Object.values(ReminderType).includes(body.type)) {
      return NextResponse.json({ error: 'Invalid reminder type' }, { status: 400 });
    }

    if (body.status && !Object.values(ReminderStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid reminder status' }, { status: 400 });
    }

    // Parse the user ID
    let userId: string;
    try {
      const userData = JSON.parse(userCookie?.userCookie?.value || '');
      userId = userData.id;
    } catch (err) {
      console.error('Invalid user cookie:', err);
      return NextResponse.json({ error: 'Invalid user data in cookie' }, { status: 400 });
    }

    const prospectExists = await Prospect.exists({ _id: id });

    if (!prospectExists) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const reminder = new Reminder({
      prospectId: id,
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status || ReminderStatus.PENDING,
      dueDate: new Date(body.dueDate),
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      isActive: true,
      addedBy: userId
    });

    const saved = await reminder.save();

    const formatted = {
      ...saved.toObject(),
      _id: saved._id.toString(),
      prospectId: saved.prospectId.toString(),
      addedBy: saved.addedBy.toString(),
      dueDate: saved.dueDate.toISOString(),
      completedAt: saved.completedAt?.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString()
    };

    return NextResponse.json(formatted, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}
