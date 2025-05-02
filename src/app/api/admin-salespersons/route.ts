import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { SalesPersonModel } from '@/models/SalesPerson';
import connectToMongoDB from '@/lib/mongoose';

export async function GET() {
  try {
    await connectToMongoDB();

    const salespersons = await SalesPersonModel
      .find({})
      .sort({ createdAt: -1 })
      .lean();

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
