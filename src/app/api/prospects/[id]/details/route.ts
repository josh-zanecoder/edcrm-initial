import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unformatPhoneNumber } from '@/utils/formatters';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongoose';
import Prospect from '@/models/Prospect';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid prospect ID' }, { status: 400 });
    }

    await connectDB();
    const prospect = await Prospect.findById(id);

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Error fetching prospect:', error);
    return NextResponse.json({ error: 'Failed to fetch prospect' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user')?.value;

    const userData = JSON.parse(userCookie || '{}');
    const updatedData = await request.json();

    // Phone formatting
    if (updatedData.phone) {
      updatedData.phone = unformatPhoneNumber(updatedData.phone);
    }

    // validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const websiteRegex = /^https?:\/\/.+/;

    if (updatedData.phone && updatedData.phone.length < 10) {
      return NextResponse.json({ error: 'Phone number must be at least 10 digits' }, { status: 400 });
    }

    if (!updatedData.address?.city || !updatedData.address?.state || !updatedData.address?.zip) {
      return NextResponse.json({ error: 'Address must include city, state, and zip' }, { status: 400 });
    }

    if (!emailRegex.test(updatedData.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (!websiteRegex.test(updatedData.website)) {
      return NextResponse.json({ error: 'Website must start with http:// or https://' }, { status: 400 });
    }

    await connectDB();

    const userInfo = {
      id: userData.uid,
      email: userData.email,
      role: userData.role
    };

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      {
        ...updatedData,
        updatedBy: userInfo,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...prospect.toObject(),
      id: prospect._id.toString(),
      _id: undefined
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
