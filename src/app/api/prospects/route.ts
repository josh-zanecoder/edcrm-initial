import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const userCookie = request.cookies.get('user')?.value;
    const tokenCookie = request.cookies.get('token')?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = JSON.parse(userCookie);
    
    const client = await clientPromise;
    const db = client.db();
    const prospects = db.collection('prospects');

    // Build search query
    const searchQuery = search
      ? {
          $and: [
            { 'assignedTo.id': userData.uid },
            {
              $or: [
                { collegeName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { 'address.city': { $regex: search, $options: 'i' } },
                { 'address.state': { $regex: search, $options: 'i' } },
                { county: { $regex: search, $options: 'i' } }
              ]
            }
          ]
        }
      : { 'assignedTo.id': userData.uid };

    // Get total count with search query
    const totalCount = await prospects.countDocuments(searchQuery);

    // Get paginated prospects with search query
    const prospectsList = await prospects.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Transform prospects
    const formattedProspects = prospectsList.map(prospect => ({
      ...prospect,
      id: prospect._id.toString(),
      _id: undefined,
      assignedTo: prospect.assignedTo || {
        id: userData.uid,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role
      },
      addedBy: prospect.addedBy || {
        id: userData.uid,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        role: userData.role
      }
    }));
    
    return NextResponse.json({
      prospects: formattedProspects,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
