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
      // Log the incoming request data
      console.log("Verify endpoint received:", {
        hasToken: !!token,
        tokenLength: token?.length,
        userProvided: !!user,
        userDetails: {
          uid: user?.uid,
          email: user?.email
        }
      });

      // Verify the ID token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log("Token verification details:", { 
        decodedUid: decodedToken.uid,
        userUid: user.uid,
        tokenExp: decodedToken.exp,
        currentTime: Math.floor(Date.now() / 1000),
        environment: process.env.NODE_ENV
      });

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
      // Enhanced error logging for deployment debugging
      const errorDetails = {
        message: error instanceof Error ? error.message : "Unknown error",
        code: error instanceof Error && 'code' in error ? error.code : undefined,
        name: error instanceof Error ? error.name : undefined,
        environment: process.env.NODE_ENV,
        adminAuthInitialized: !!adminAuth
      };
      
      console.error("Token verification error details:", errorDetails);

      // If token is expired, return a specific error
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "auth/id-token-expired"
      ) {
        return NextResponse.json(
          { 
            error: "Token has expired",
            details: errorDetails
          },
          { status: 401 }
        );
      }

      // For other errors, return a generic error with details
      return NextResponse.json({ 
        error: "Invalid token",
        details: errorDetails
      }, { status: 401 });
    }
  } catch (error: unknown) {
    const requestError = {
      message: error instanceof Error ? error.message : "Unknown error",
      type: error instanceof Error ? error.name : typeof error
    };
    console.error("Verification error:", requestError);
    return NextResponse.json({
      error: "Invalid request format",
      details: requestError
    }, { status: 400 });
  }
}
