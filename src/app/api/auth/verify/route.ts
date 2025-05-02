import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { token, user } = await request.json();

    if (!token || !user) {
      console.error("Missing token or user data:", {
        token: !!token,
        user: !!user,
      });
      return NextResponse.json(
        { error: "Token and user data are required" },
        { status: 400 }
      );
    }

    try {
      // Verify the ID token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log("Token verified successfully:", { uid: decodedToken.uid });

      // Check if the token belongs to the user
      if (decodedToken.uid !== user.uid) {
        console.error("Token UID mismatch:", {
          tokenUid: decodedToken.uid,
          userUid: user.uid,
        });
        return NextResponse.json(
          { error: "Token does not match user" },
          { status: 401 }
        );
      }

      // Get MongoDB client
      const client = await clientPromise;
      const db = client.db();

      // Check if user exists in salespersons collection
      const salesperson = await db.collection("salespersons").findOne({
        firebase_uid: decodedToken.uid,
      });

      console.log("User role check:", {
        uid: decodedToken.uid,
        isSalesperson: !!salesperson,
      });

      const userData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: user.displayName || decodedToken.email?.split("@")[0],
        firstName: salesperson?.first_name || null,
        lastName: salesperson?.last_name || null,
        token: token,
        twilioNumber: salesperson?.twilio_number || null,
        id: salesperson?._id || null,
        role: salesperson ? "salesperson" : "admin",
        redirectTo: salesperson ? "/salesperson" : "/admin",
      };
      console.log("User data:", userData);
      return NextResponse.json({
        valid: true,
        user: userData,
      });
    } catch (error: unknown) {
      console.error("Token verification error:", error);

      // If token is expired, return a specific error
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "auth/id-token-expired"
      ) {
        return NextResponse.json(
          { error: "Token has expired" },
          { status: 401 }
        );
      }

      // For other errors, return a generic error
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error: unknown) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}
