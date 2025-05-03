import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectToMongoDB from '@/lib/mongoose';
import Prospect from '@/models/Prospect';
import { unformatPhoneNumber } from '@/utils/formatters';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB(); // ✅ use the same connection

    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');


    const userData = JSON.parse(userCookie?.value || '');
    const data = await request.json();

    if (data.phone) {
      data.phone = unformatPhoneNumber(data.phone);
    }

    const requiredFields = ['collegeName', 'phone', 'email', 'address', 'county', 'website', 'collegeTypes'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missingFields.join(', ')}` }, { status: 400 });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const websiteRegex = /^https?:\/\//;
    if (!websiteRegex.test(data.website)) {
      return NextResponse.json({ error: 'Website must start with http:// or https://' }, { status: 400 });
    }

    if (!data.address.city || !data.address.state || !data.address.zip) {
      return NextResponse.json({ error: 'Address must include city, state, and zip' }, { status: 400 });
    }

    if (!Array.isArray(data.collegeTypes) || data.collegeTypes.length === 0) {
      return NextResponse.json({ error: 'At least one college type must be selected' }, { status: 400 });
    }

    if (data.phone.length < 10) {
      return NextResponse.json({ error: 'Phone number must be at least 10 digits' }, { status: 400 });
    }

    const userInfo = {
      _id: new ObjectId(userData.id),
      id: userData.uid,
      email: userData.email,
      role: userData.role
    };

    const newProspect = await Prospect.create({
      ...data,
      status: 'New',
      lastContact: new Date(),
      addedBy: userInfo,
      assignedTo: userInfo
    });

    return NextResponse.json(
      {
        ...newProspect.toObject(),
        id: newProspect._id.toString(),
        _id: undefined
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prospect:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
