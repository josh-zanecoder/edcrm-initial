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

    return NextResponse.json({ userData });
  } catch (error) {
    console.error("Error in authenticated route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
