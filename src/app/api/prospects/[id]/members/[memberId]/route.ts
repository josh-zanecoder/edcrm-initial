import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import Member from '@/models/Member';
import connectToMongoDB from '@/lib/mongoose';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  await connectToMongoDB();
  const { id, memberId } = await context.params;

  try {
    const body = await request.json();

    if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (body.phone && !/^\+?[\d\s-()]{10,}$/.test(body.phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const member = await Member.findOne({ _id: memberId, prospectId: id });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    Object.assign(member, body, { updatedAt: new Date() });

    await member.validate();
    const updatedMember = await member.save();

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  await connectToMongoDB();
  const { id, memberId } = await context.params;

  try {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(memberId)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const member = await Member.findOne({ _id: memberId, prospectId: id });
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    member.isActive = false;
    member.updatedAt = new Date();
    await member.save();

    return NextResponse.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
