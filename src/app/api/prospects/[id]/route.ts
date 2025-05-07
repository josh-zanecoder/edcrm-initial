import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToMongoDB from "@/lib/mongoose";
import Prospect from "@/models/Prospect";
import { ObjectId } from "mongodb";

// DELETE /api/prospects/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToMongoDB();
    const { id } = await context.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid prospect ID format" },
        { status: 400 }
      );
    }

    // Find and delete the prospect
    const deletedProspect = await Prospect.findByIdAndDelete(id);

    if (!deletedProspect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Prospect deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting prospect:", error);
    return NextResponse.json(
      { error: "Failed to delete prospect" },
      { status: 500 }
    );
  }
}
