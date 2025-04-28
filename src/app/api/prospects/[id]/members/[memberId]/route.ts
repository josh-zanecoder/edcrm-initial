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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id, memberId } = await context.params;
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Log the raw values and types
    console.log('Update request:', {
      memberId,
      prospectId: id,
      memberIdType: typeof memberId,
      prospectIdType: typeof id,
      updateData: body
    });

    // Try converting to ObjectId and catch errors
    let memberObjectId, prospectObjectId;
    try {
      memberObjectId = new ObjectId(memberId);
      prospectObjectId = new ObjectId(id);
    } catch{
      console.error('Invalid ObjectId format:', { memberId, id });
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Validate email if provided
    if (body.email) {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Validate phone if provided
    if (body.phone) {
      const phoneRegex = /^\+?[\d\s-()]{10,}$/;
      if (!phoneRegex.test(body.phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    const client = await clientPromise;
    const db = client.db();

    // Log the ObjectIds being used
    console.log('Querying with ObjectIds:', {
      memberObjectId: memberObjectId.toHexString(),
      prospectObjectId: prospectObjectId.toHexString()
    });

    // First, check if the member exists
    const member = await db.collection('members').findOne({ 
      _id: memberObjectId,
      prospectId: prospectObjectId
    });

    console.log('Found member:', member);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prepare the update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove any fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.addedBy;
    delete updateData.prospectId;

    console.log('Update data:', updateData);

    // Update the member
    const result = await db.collection('members').updateOne(
      {
        _id: memberObjectId,
        prospectId: prospectObjectId
      },
      { 
        $set: updateData
      }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Member not found or not updated' },
        { status: 404 }
      );
    }

    // Fetch the updated member
    const updatedMember = await db.collection('members').findOne({
      _id: memberObjectId,
      prospectId: prospectObjectId
    });

    console.log('Updated member:', updatedMember);

    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Failed to fetch updated member' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update member',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/prospects/[id]/members/[memberId] - Delete a member (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { userCookie, tokenCookie } = await getCookies();

    if (!userCookie?.value || !tokenCookie?.value) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, memberId } = await context.params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid prospect ID' },
        { status: 400 }
      );
    }

    if (!memberId || !ObjectId.isValid(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const members = db.collection('members');

    // First verify the member belongs to this prospect
    const member = await members.findOne({
      _id: new ObjectId(memberId),
      prospectId: new ObjectId(id)
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const result = await members.updateOne(
      { _id: new ObjectId(memberId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete member' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Member deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
} 