import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get('user')?.value;
   

    const userData = JSON.parse(userCookie || '');

    if (!ObjectId.isValid(userData.id)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const userId = new ObjectId(userData.id);
    const client = await clientPromise;
    const db = client.db();

    const prospects = db.collection('prospects');
    const reminders = db.collection('reminders');
    const activities = db.collection('activities');

    // Get all prospect IDs assigned to this user
    const assignedProspects = await prospects
      .find({ 'assignedTo.id': userData.uid }, { projection: { _id: 1 } })
      .toArray();
    const prospectIds = assignedProspects.map(p => p._id);

    // Run all in parallel
    const [
      totalProspects,
      pendingReminders,
      upcomingReminders,
      recentActivities
    ] = await Promise.all([
      Promise.resolve(assignedProspects.length),
      reminders.countDocuments({
        prospectId: { $in: prospectIds },
        status: 'PENDING',
        isActive: true
      }),
      reminders.find({
        prospectId: { $in: prospectIds },
        dueDate: { $gte: new Date() },
        status: 'PENDING',
        isActive: true
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .project({ _id: 1, title: 1, dueDate: 1, type: 1, prospectId: 1 })
        .toArray(),
      activities.find({
        prospectId: { $in: prospectIds },
        isActive: true
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ _id: 1, title: 1, createdAt: 1, type: 1, prospectId: 1 })
        .toArray()
    ]);
    console.log('totalProspects', totalProspects);
    console.log('pendingReminders', pendingReminders);
    console.log('upcomingReminders', upcomingReminders);
    console.log('recentActivities', recentActivities);
    return NextResponse.json({
      stats: {
        totalProspects,
        pendingReminders,
        upcomingReminders,
        recentActivities,
      },
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
