import { NextRequest, NextResponse } from 'next/server';
import { SalesPersonModel } from '@/models/SalesPerson';
import connectToMongoDB from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToMongoDB();

    const salespersons = await SalesPersonModel.find({})
      .select('first_name last_name email phone status role joinDate')
      .sort({ joinDate: -1 })
      .lean();

    // Convert MongoDB documents to format expected by frontend
    const formattedSalespersons = salespersons.map(person => ({
      ...person,
      id: person._id.toString(),
      _id: undefined
    }));

    return NextResponse.json(formattedSalespersons);
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch salespersons' },
      { status: 500 }
    );
  }
}