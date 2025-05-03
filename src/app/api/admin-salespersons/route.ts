import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { SalesPersonModel, SalesPerson } from '@/models/SalesPerson';
import connectToMongoDB from '@/lib/mongoose';

export async function GET() {
  try {
    // Ensure MongoDB connection
    await connectToMongoDB();

    // Fetch all salespersons and sort by creation date (newest first)
    const salespersons = await SalesPersonModel
      .find({})
      .sort({ createdAt: -1 })
      .select('-__v') // Exclude Mongoose's internal __v field
      .lean<SalesPerson[]>(); // Use lean for better performance and proper typing

    // Transform the data to match the expected format
    const transformedSalespersons = salespersons.map(person => {
      const { _id, ...rest } = person;
      return {
        ...rest,
        id: _id.toString()
      };
    });

    return NextResponse.json(transformedSalespersons);
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    
    // Handle specific MongoDB/Mongoose errors
    if (error instanceof mongoose.Error) {
      return NextResponse.json(
        { error: 'Database operation failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch salespersons' },
      { status: 500 }
    );
  }
}
