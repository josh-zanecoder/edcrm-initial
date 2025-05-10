import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import connectToMongoDB from "@/lib/mongoose";
import Prospect from "@/models/Prospect";
import Reminder from "@/models/Reminder";
import Activity from "@/models/Activity";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userCookie = request.cookies.get("user")?.value;

    if (!userCookie) {
      return NextResponse.json(
        { error: "No user cookie found" },
        { status: 401 }
      );
    }

    const userData = JSON.parse(userCookie || "");

    if (!ObjectId.isValid(userData.id)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Connect to MongoDB via Mongoose
    await connectToMongoDB();

    // Get all prospect IDs assigned to this user
    const assignedProspects = await Prospect.find(
      { "assignedTo._id": userData.id },
      { _id: 1 }
    ).lean();

    const prospectIds = assignedProspects.map((p) => p._id);

    // Calculate date range for 3-day window
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(now.getDate() + 3);

    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);

    // Run all queries in parallel
    const [pendingReminders, upcomingReminders, recentActivities] =
      await Promise.all([
        Reminder.countDocuments({
          prospectId: { $in: prospectIds },
          status: "PENDING",
          isActive: true,
        }),
        Reminder.find({
          prospectId: { $in: prospectIds },
          dueDate: {
            $gte: now, // Due date is today or in the future
            $lte: threeDaysFromNow, // Due date is within next 3 days
          },
          status: "PENDING",
          isActive: true,
        })
          .select("_id title dueDate type prospectId")
          .sort({ dueDate: 1 })
          .limit(5)
          .lean(),
        Activity.find({
          prospectId: { $in: prospectIds },
          createdAt: { $gte: threeDaysAgo }, // Created within the last 3 days
          isActive: true,
        })
          .select("_id title createdAt type prospectId")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return NextResponse.json({
      stats: {
        totalProspects: assignedProspects.length,
        pendingReminders,
        upcomingReminders,
        recentActivities,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
