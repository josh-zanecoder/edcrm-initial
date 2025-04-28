import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const user = request.cookies.get('user')?.value;
  const token = request.cookies.get('token')?.value;

  // If no user or token, redirect to login
  if (!user || !token) {
    if (request.nextUrl.pathname.startsWith('/login')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const userData = JSON.parse(user);
    const { role } = userData;

    // If user is a salesperson trying to access admin routes
    if (role === 'salesperson' && request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/salesperson', request.url));
    }

    // If user is an admin trying to access salesperson routes
    if (role === 'admin' && request.nextUrl.pathname.startsWith('/salesperson')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If there's an error parsing the user data, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/salesperson/:path*',
    '/login',
  ],
}; 