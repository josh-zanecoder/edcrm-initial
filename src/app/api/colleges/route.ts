import { NextRequest, NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import Prospect from "@/models/Prospect";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectToMongoDB();

    const cookieStore = cookies();
    const userCookie = (await cookieStore).get("user")?.value;
    const tokenCookie = (await cookieStore).get("token")?.value;

    if (!userCookie || !tokenCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = JSON.parse(userCookie);

    // Find all prospects assigned to the salesperson and select only college-related fields
    const colleges = await Prospect.find({ "assignedTo._id": userData.id })
      .select(
        "collegeName collegeTypes website address county bppeApproved email"
      )
      .sort({ collegeName: 1 })
      .lean();

    console.log("colleges", colleges);

    // Transform the data to a more suitable format for the frontend
    const formattedColleges = colleges.map((college) => ({
      id: (college as any)._id.toString(),
      name: college.collegeName,
      email: college.email,
      types: college.collegeTypes,
      website: college.website,
      location: {
        city: college.address.city,
        state: college.address.state,
        county: college.county,
      },
      bppeApproved: college.bppeApproved,
    }));

    return NextResponse.json({
      colleges: formattedColleges,
      totalCount: formattedColleges.length,
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
