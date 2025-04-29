import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('user')?.value;
    const tokenCookie = request.cookies.get('token')?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = JSON.parse(userCookie);
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');
    const search = searchParams.get('search') || '';
    const skip = Math.max(0, (page - 1) * limit); // Ensure skip is never negative
    
    const client = await clientPromise;
    const db = client.db();
    const prospects = db.collection('prospects');

    // Build query
    const query: any = {
      'assignedTo.id': userData.uid
    };

    if (search) {
      query.$or = [
        { collegeName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
        { 'address.state': { $regex: search, $options: 'i' } },
        { county: { $regex: search, $options: 'i' } },
        { collegeTypes: { $elemMatch: { $regex: search, $options: 'i' } } }
      ];
    }

    // Get total count first
    const totalCount = await prospects.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Adjust page if it exceeds total pages
    const validPage = Math.min(page, totalPages);
    const validSkip = Math.max(0, (validPage - 1) * limit);

    // Get paginated prospects with proper sorting
    const prospectsList = await prospects
      .find(query)
      .sort({ createdAt: -1 }) // Add sorting to ensure consistent ordering
      .skip(validSkip)
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

    // Add debugging information in development
    const debug = process.env.NODE_ENV === 'development' ? {
      debug: {
        page,
        limit,
        skip: validSkip,
        totalCount,
        totalPages,
        resultsCount: prospectsList.length
      }
    } : {};

    return NextResponse.json({
      prospects: formattedProspects,
      totalCount,
      currentPage: validPage,
      totalPages,
      ...debug
    });

  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
