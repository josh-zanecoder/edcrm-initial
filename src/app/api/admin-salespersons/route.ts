import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const salespersons = await db
      .collection('salespersons')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      salespersons.map(person => ({
        ...person,
        id: person._id.toString(),
        _id: undefined
      }))
    );
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salespersons' },
      { status: 500 }
    );
  }
} 