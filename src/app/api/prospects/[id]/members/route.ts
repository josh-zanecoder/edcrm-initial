import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import connectToMongoDB from '@/lib/mongoose';
import Member from '@/models/Member';
import Prospect from '@/models/Prospect'; // Needed for prospect existence check

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token'),
  };
};

// GET /api/prospects/[id]/members
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {


    const { id } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectToMongoDB();

    const prospectExists = await Prospect.exists({ _id: id });
    if (!prospectExists) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    const members = await Member.find({ 
      prospectId: id,
      isActive: true
    }).sort({ createdAt: -1 });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/prospects/[id]/members
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userCookie = await getCookies();



    const user = JSON.parse(userCookie?.userCookie?.value || '');
    const body = await request.json();
    const { id } = await context.params;

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'collegeName'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    await connectToMongoDB();

    const newMember = new Member({
      ...body,
      prospectId: id,
      addedBy: user.id,
    });

    await newMember.validate();

    const savedMember = await newMember.save();

    return NextResponse.json(savedMember, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating member:', error);
  
    // Handle Mongoose validation errors
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  
    // Handle duplicate key error
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as any).code === 11000
    ) {
      return NextResponse.json(
        {
          error: 'Duplicate entry',
          details: (error as any).keyValue,
        },
        { status: 409 }
      );
    }
  
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
  
}
