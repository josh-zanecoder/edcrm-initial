import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

// GET /api/prospects/[id]/members - Get all members for a prospect
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

    // First verify the prospect exists
    const prospect = await db.collection('prospects').findOne({ 
      _id: new ObjectId(id)
    });

    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    // Fetch active members for this prospect
    const members = await db.collection('members')
      .find({ 
        prospectId: new ObjectId(id),
        isActive: true 
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('Raw members query result:', JSON.stringify(members, null, 2));

    if (!members || members.length === 0) {
      console.log('No members found for prospect:', id);
      return NextResponse.json([]);
    }

    // Convert ObjectId to string for the response
    const formattedMembers = members.map(member => {
      const formatted = {
        ...member,
        _id: member._id.toString(),
        prospectId: member.prospectId.toString(),
        addedBy: member.addedBy?.toString(),
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString()
      };
      console.log('Formatted member:', JSON.stringify(formatted, null, 2));
      return formatted;
    });

    console.log('Final response:', JSON.stringify(formattedMembers, null, 2));
    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/prospects/[id]/members - Create a new member
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

    const user = JSON.parse(userCookie.value);
    const body = await request.json();
    const { id } = await context.params;

    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'collegeName'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'Missing required fields', fields: missingFields },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone number
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const member = {
      ...body,
      prospectId: new ObjectId(id),
      addedBy: new ObjectId(user.id),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('members').insertOne(member);
    const createdMember = await db.collection('members').findOne({ _id: result.insertedId });

    return NextResponse.json(createdMember, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}

