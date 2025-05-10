import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get("user");
  const tokenCookie = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/api/auth/login",
    "/api/auth/verify",
    "/api/auth/google/check",
    "/api/twilio/voice",
    "/api/twilio/incoming",
    "/api/twilio/dial-status",
    "/api/twilio/call-status",
    "/api/twilio/recording-status",
    "/api/health",
    "/api/twilio/incoming-call-status",
    "/api/twilio/transcribe",
    "/api/tasks/create",
  ];

  // Check if the path is public
  if (publicPaths.includes(pathname)) {
    // If user is authenticated and tries to access login, redirect to dashboard
    if (pathname === "/login" && userCookie && tokenCookie) {
      const user = JSON.parse(userCookie.value);
      const redirectUrl =
        user.role === "admin" ? "/admin/dashboard" : "/salesperson/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // If no auth cookies and not on a public path, redirect to login
  if (!userCookie || !tokenCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Role-based access control
  if (userCookie && tokenCookie) {
    const user = JSON.parse(userCookie.value);

    // Admin routes protection
    if (pathname.startsWith("/admin") && user.role !== "admin") {
      return NextResponse.redirect(
        new URL("/salesperson/dashboard", request.url)
      );
    }

    // Salesperson routes protection
    if (pathname.startsWith("/salesperson") && user.role !== "salesperson") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health).*)"],
};
