import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Utility function to remove formatting from phone numbers
const unformatPhoneNumber = (phone: string) => {
  return phone.replace(/[^\d+]/g, '');
};

const getCookies = async () => {
  const cookieStore = await cookies();
  return {
    userCookie: cookieStore.get('user'),
    tokenCookie: cookieStore.get('token')
  };
};

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
    
    const prospect = await prospects.findOne({ _id: new ObjectId(id) });
    
    if (!prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error('Error fetching prospect:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prospect' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    // Get token from cookies using old method
    const userCookie = request.cookies.get('user')?.value;
    const tokenCookie = request.cookies.get('token')?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userCookie);

    // Get request body
    const updatedData = await request.json();
    console.log('Received update data:', updatedData);

    // Format phone number before validation
    if (updatedData.phone) {
      updatedData.phone = unformatPhoneNumber(updatedData.phone);
    }

    // Validate required fields
    const {
      collegeName,
      phone,
      email,
      address,
      county,
      website,
      collegeTypes,
      bppeApproved,
      status
    } = updatedData;

    // Add phone validation
    if (phone && phone.length < 10) {
      return NextResponse.json({
        error: 'Validation Error',
        details: 'Phone number must be at least 10 digits'
      }, { status: 400 });
    }

    // Validate address
    if (!address.city || !address.state || !address.zip) {
      console.error('Invalid address:', address);
      return NextResponse.json(
        { error: 'Address must include city, state, and zip' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate website format
    const websiteRegex = /^https?:\/\/.+/;
    if (!websiteRegex.test(website)) {
      console.error('Invalid website format:', website);
      return NextResponse.json(
        { error: 'Website must start with http:// or https://' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const prospectsCollection = db.collection('prospects');

    // Check if prospect exists
    const existingProspect = await prospectsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!existingProspect) {
      console.error('Prospect not found:', id);
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      );
    }

    const userInfo = {
      id: userData.uid,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
      role: userData.role
    };

    console.log('Updating prospect with user info:', userInfo);

    // Update prospect with unformatted phone
    const updateResult = await prospectsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          collegeName,
          phone, // Phone is already unformatted
          email,
          address,
          county,
          website,
          collegeTypes,
          bppeApproved,
          status,
          updatedAt: new Date(),
          updatedBy: userInfo
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.error('Failed to update prospect:', id);
      return NextResponse.json(
        { error: 'Failed to update prospect' },
        { status: 500 }
      );
    }

    // Get updated prospect
    const updatedProspect = await prospectsCollection.findOne({
      _id: new ObjectId(id)
    });

    if (!updatedProspect) {
      console.error('Failed to retrieve updated prospect:', id);
      return NextResponse.json(
        { error: 'Failed to retrieve updated prospect' },
        { status: 500 }
      );
    }

    console.log('Successfully updated prospect:', id);
    return NextResponse.json({
      ...updatedProspect,
      id: updatedProspect._id.toString(),
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