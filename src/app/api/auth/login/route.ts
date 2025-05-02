import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import connectToMongoDB from "@/lib/mongoose";
import { UserModel } from "@/models/User";
import { SalesPersonModel } from "@/models/SalesPerson";  // Already defined SalesPerson model

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Connect to MongoDB via Mongoose
      await connectToMongoDB();

      // Find user in MongoDB
      const userRecord = await UserModel.findOne({ firebase_uid: user.uid });

      if (!userRecord) {
        return NextResponse.json(
          { error: "User not authorized. Please contact administrator." },
          { status: 403 }
        );
      }

      // Get additional user data from salespersons collection if needed
      const salesperson =
        userRecord.role === "salesperson"
          ? await SalesPersonModel.findOne({ firebase_uid: user.uid })
          : null;

      const session = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || email.split("@")[0],
        token: token,
        role: userRecord.role,
        id: salesperson?._id,
        firstName: salesperson?.first_name,
        twilioNumber: salesperson?.twilio_number || null,
        lastName: salesperson?.last_name,
        redirectTo: userRecord.role === "admin" ? "/admin" : "/salesperson",
      };

      return NextResponse.json({
        user: session,
        message: "Login successful",
      });
    } catch (firebaseError: unknown) {
      console.error("Firebase authentication error:", firebaseError);
      return NextResponse.json(
        { error: (firebaseError as Error).message || "Authentication failed" },
        { status: 401 }
      );
    }
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}
