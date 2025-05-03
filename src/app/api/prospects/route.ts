import { NextRequest, NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import Prospect from "@/models/Prospect";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const userCookie = request.cookies.get("user")?.value;
    const tokenCookie = request.cookies.get("token")?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = JSON.parse(userCookie);

    const baseQuery = { "assignedTo._id": userData.id };

    const searchQuery = search
      ? {
          ...baseQuery,
          $or: [
            { collegeName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { "address.city": { $regex: search, $options: "i" } },
            { "address.state": { $regex: search, $options: "i" } },
            { county: { $regex: search, $options: "i" } },
          ],
        }
      : baseQuery;

    const totalCount = await Prospect.countDocuments(searchQuery);

    const prospectsList = await Prospect.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedProspects = prospectsList.map((prospect) => ({
      ...prospect,
      id: (prospect._id as mongoose.Types.ObjectId).toString(),
      _id: undefined,
      assignedTo: prospect.assignedTo || {
        _id: userData.id,
        email: userData.email,
        role: userData.role,
      },
      addedBy: prospect.addedBy || {
        _id: userData.id,
        email: userData.email,
        role: userData.role,
      },
    }));

    return NextResponse.json({
      prospects: formattedProspects,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    });
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
