import { NextRequest, NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import Prospect from "@/models/Prospect";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { unformatPhoneNumber } from "@/utils/formatters";
import { ObjectId } from "mongodb";

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

export async function POST(request: NextRequest) {
  try {
    await connectToMongoDB(); // ✅ use the same connection

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");

    const userData = JSON.parse(userCookie?.value || "");
    const data = await request.json();

    if (data.phone) {
      data.phone = unformatPhoneNumber(data.phone);
    }

    const requiredFields = [
      "collegeName",
      "phone",
      "email",
      "address",
      "county",
      "website",
      "collegeTypes",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const websiteRegex = /^https?:\/\//;
    if (!websiteRegex.test(data.website)) {
      return NextResponse.json(
        { error: "Website must start with http:// or https://" },
        { status: 400 }
      );
    }

    if (!data.address.city || !data.address.state || !data.address.zip) {
      return NextResponse.json(
        { error: "Address must include city, state, and zip" },
        { status: 400 }
      );
    }

    if (!Array.isArray(data.collegeTypes) || data.collegeTypes.length === 0) {
      return NextResponse.json(
        { error: "At least one college type must be selected" },
        { status: 400 }
      );
    }

    if (data.phone.length < 10) {
      return NextResponse.json(
        { error: "Phone number must be at least 10 digits" },
        { status: 400 }
      );
    }

    const userInfo = {
      _id: new ObjectId(userData.id),
      id: userData.uid,
      email: userData.email,
      role: userData.role,
    };

    const newProspect = await Prospect.create({
      ...data,
      status: "New",
      lastContact: new Date(),
      addedBy: userInfo,
      assignedTo: userInfo,
    });

    return NextResponse.json(
      {
        ...newProspect.toObject(),
        id: newProspect._id.toString(),
        _id: undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating prospect:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
