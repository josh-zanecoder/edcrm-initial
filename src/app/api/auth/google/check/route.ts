import { NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { SalesPersonModel } from "@/models/SalesPerson";
import { adminAuth } from "@/lib/firebase-admin";

// Add dynamic configuration
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Add logging middleware
export async function POST(request: Request) {
  console.log("API Route hit: /api/auth/google/check");
  console.log("Request method:", request.method);
  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    const body = await request.json();
    console.log("Request body:", body);
    const { uid } = body;

    if (!uid) {
      console.log("Missing UID in request");
      return NextResponse.json(
        { error: "Missing user ID", exists: false },
        { status: 400 }
      );
    }

    await connectToMongoDB();
    console.log("Checking user:", uid);

    const userRecord = await UserModel.findOne({ firebase_uid: uid });
    console.log("User record:", userRecord);

    if (!userRecord) {
      // Delete the user from Firebase Auth if they don't exist in MongoDB
      try {
        await adminAuth.deleteUser(uid);
        console.log("Deleted unregistered user from Firebase Auth:", uid);
      } catch (firebaseError) {
        console.error("Error deleting user from Firebase Auth:", firebaseError);
      }

      return NextResponse.json(
        {
          error: "Account not registered. Please contact administrator.",
          exists: false,
        },
        { status: 404 }
      );
    }

    const salesperson =
      userRecord.role === "salesperson"
        ? await SalesPersonModel.findOne({ firebase_uid: uid })
        : null;

    return NextResponse.json({
      exists: true,
      firstName: salesperson?.first_name || null,
      lastName: salesperson?.last_name || null,
      role: userRecord.role,
      id: salesperson?._id || null,
      twilioNumber: salesperson?.twilio_number || null,
    });
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json(
      { error: "Server error", exists: false },
      { status: 500 }
    );
  }
}
