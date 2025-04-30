import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { unformatPhoneNumber } from '@/utils/formatters';


export async function POST(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('user')?.value;
    const tokenCookie = request.cookies.get('token')?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = JSON.parse(userCookie);
    
    const client = await clientPromise;
    const db = client.db();
    const prospects = db.collection('prospects');
    
    const data = await request.json();
    
    // Format phone number before validation
    if (data.phone) {
      data.phone = unformatPhoneNumber(data.phone);
    }
    
    // Validate required fields
    const requiredFields = ['collegeName', 'phone', 'email', 'address', 'county', 'website', 'collegeTypes'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Validation Error',
        details: `Missing required fields: ${missingFields.join(', ')}`
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'Invalid email format'
      }, { status: 400 });
    }

    // Validate website format
    const websiteRegex = /^https?:\/\//;
    if (!websiteRegex.test(data.website)) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'Website must start with http:// or https://'
      }, { status: 400 });
    }

    // Validate address
    if (!data.address.city || !data.address.state || !data.address.zip) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'Address must include city, state, and zip'
      }, { status: 400 });
    }

    // Validate college types
    if (!Array.isArray(data.collegeTypes) || data.collegeTypes.length === 0) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'At least one college type must be selected'
      }, { status: 400 });
    }

    const userInfo = {
      id: userData.uid,
      email: userData.email,
      role: userData.role
    };

    // Add phone validation
    if (data.phone && data.phone.length < 10) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'Phone number must be at least 10 digits'
      }, { status: 400 });
    }

    const prospect = {
      ...data,
      phone: data.phone, // Phone is already unformatted
      status: 'New',
      lastContact: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      addedBy: userInfo,
      assignedTo: userInfo
    };

    const result = await prospects.insertOne(prospect);
    console.log(result);
    return NextResponse.json({
      ...prospect,
      id: result.insertedId.toString(),
      _id: undefined
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating prospect:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}