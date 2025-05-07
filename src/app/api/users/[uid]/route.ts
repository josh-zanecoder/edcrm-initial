import { NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { SalesPersonModel } from "@/models/SalesPerson";

export async function GET(
  request: Request,
  { params }: { params: { uid: string } }
) {
  try {
    await connectToMongoDB();
    console.log("DB connected, checking user:", params.uid);

    const userRecord = await UserModel.findOne({ firebase_uid: params.uid });
    console.log("Found user record:", userRecord);

    if (!userRecord) {
      return NextResponse.json(
        {
          exists: false,
          error: "Account not registered. Please contact administrator.",
        },
        { status: 404 }
      );
    }

    const salesperson =
      userRecord.role === "salesperson"
        ? await SalesPersonModel.findOne({ firebase_uid: params.uid })
        : null;

    return NextResponse.json({
      exists: true,
      role: userRecord.role,
      id: salesperson?._id || null,
      firstName: salesperson?.first_name || null,
      lastName: salesperson?.last_name || null,
      twilioNumber: salesperson?.twilio_number || null,
    });
  } catch (error) {
    console.error("User check error:", error);
    return NextResponse.json(
      { exists: false, error: "Server error" },
      { status: 500 }
    );
  }
}
