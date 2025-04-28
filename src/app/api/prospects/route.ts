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
    
    const client = await clientPromise;
    const db = client.db();
    const prospects = db.collection('prospects');
    
    // Filter prospects where assignedTo.id matches the logged-in user's ID
    const prospectsList = await prospects.find({
      'assignedTo.id': userData.uid
    }).toArray();
    
    // Transform _id to id and ensure user fields are properly structured
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
    
    return NextResponse.json(formattedProspects);
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
 