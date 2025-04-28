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

// GET /api/prospects/[id]/reminders - Get all active reminders for a prospect
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
    const prospects = db.collection('prospects');
    const reminders = db.collection('reminders');

    // First verify the prospect exists
    const prospect = await prospects.findOne({ _id: new ObjectId(id) });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    // Get all active reminders for this prospect
    const remindersList = await reminders
      .find({
        prospectId: new ObjectId(id),
        isActive: true
      })
      .toArray();

    // Format the response
    const formattedReminders = remindersList.map(reminder => ({
      ...reminder,
      _id: reminder._id.toString(),
      prospectId: reminder.prospectId.toString(),
      addedBy: reminder.addedBy.toString(),
      dueDate: reminder.dueDate.toISOString(),
      completedAt: reminder.completedAt?.toISOString(),
      createdAt: reminder.createdAt.toISOString(),
      updatedAt: reminder.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedReminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// POST /api/prospects/[id]/reminders - Create a new reminder
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
    if (!body.title || !body.description || !body.type || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate reminder type
    if (!Object.values(ReminderType).includes(body.type)) {
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
    const prospects = db.collection('prospects');
    const reminders = db.collection('reminders');

    // Verify the prospect exists
    const prospect = await prospects.findOne({ _id: new ObjectId(id) });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    // Parse the user ID from the cookie
    let userId: ObjectId;
    try {
      const userData = JSON.parse(userCookie.value);
      userId = new ObjectId(userData.id);
    } catch (error) {
      console.error('Error parsing user cookie:', error);
      return NextResponse.json(
        { error: 'Invalid user data in cookie' },
        { status: 400 }
      );
    }

    // Create the new reminder
    const newReminder = {
      prospectId: new ObjectId(id),
      title: body.title,
      description: body.description,
      type: body.type,
      status: body.status || ReminderStatus.PENDING,
      dueDate: new Date(body.dueDate),
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      addedBy: userId
    };

    const result = await reminders.insertOne(newReminder);

    // Fetch the created reminder
    const createdReminder = await reminders.findOne({ _id: result.insertedId });

    if (!createdReminder) {
      return NextResponse.json(
        { error: 'Failed to create reminder' },
        { status: 500 }
      );
    }

    // Format the response
    const formattedReminder = {
      ...createdReminder,
      _id: createdReminder._id.toString(),
      prospectId: createdReminder.prospectId.toString(),
      addedBy: createdReminder.addedBy.toString(),
      dueDate: createdReminder.dueDate.toISOString(),
      completedAt: createdReminder.completedAt?.toISOString(),
      createdAt: createdReminder.createdAt.toISOString(),
      updatedAt: createdReminder.updatedAt.toISOString()
    };

    return NextResponse.json(formattedReminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
