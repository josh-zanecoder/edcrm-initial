import { NextResponse } from "next/server";
import connectToMongoDB from "@/lib/mongoose";
import { SalesPersonModel } from "@/models/SalesPerson";
import { CreateSalespersonInput } from "@/types/salesperson";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/lib/firebase";
import { unformatPhoneNumber } from "@/utils/formatters";
import { UserModel } from "@/models/User";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToMongoDB();

    const salespersons = await SalesPersonModel.find(
      {},
      {
        first_name: 1,
        last_name: 1,
        email: 1,
        phone: 1,
        status: 1,
        joinDate: 1,
        createdAt: 1,
      }
    )
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return NextResponse.json(
      salespersons.map((person) => ({
        ...person,
        id: person._id.toString(),
      }))
    );
  } catch (error) {
    console.error("Error fetching salespersons:", error);
    return NextResponse.json(
      { error: "Failed to fetch salespersons" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToMongoDB();

    const body = await request.json();
    const { first_name, last_name, email, phone, password, twilio_number } =
      body as CreateSalespersonInput & { password: string };

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists in either collection
    const [existingUser, existingSalesperson] = await Promise.all([
      UserModel.findOne({ email }),
      SalesPersonModel.findOne({ email }),
    ]);

    if (existingUser || existingSalesperson) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Create Firebase user
    let firebaseUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      firebaseUser = userCredential.user;
    } catch (error: unknown) {
      console.error("Firebase user creation error:", error);
      return NextResponse.json(
        {
          error:
            "Failed to create user account: " +
            (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 400 }
      );
    }

    // Create user record
    const newUser = new UserModel({
      firebase_uid: firebaseUser.uid,
      email,
      role: "salesperson",
      status: "active",
    });

    // Create salesperson record with unformatted phone numbers
    const newSalesperson = new SalesPersonModel({
      first_name,
      last_name,
      email,
      phone: unformatPhoneNumber(phone),
      twilio_number: twilio_number ? unformatPhoneNumber(twilio_number) : null,
      firebase_uid: firebaseUser.uid,
      status: "active",
      role: "salesperson",
      joinDate: new Date().toISOString(),
    });

    // Create both records in a transaction using Mongoose
    const session = await UserModel.startSession();
    try {
      await session.withTransaction(async () => {
        await newUser.save({ session });
        await newSalesperson.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return NextResponse.json(
      {
        message: "Salesperson created successfully",
        user: {
          ...newUser.toObject(),
          id: newUser.firebase_uid,
        },
        salesperson: {
          ...newSalesperson.toObject(),
          id: newSalesperson._id.toString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating salesperson:", error);
    return NextResponse.json(
      { error: "Failed to create salesperson" },
      { status: 500 }
    );
  }
}
