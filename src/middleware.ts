import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userCookie = request.cookies.get('user');
  const tokenCookie = request.cookies.get('token');
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api/auth/login', 
    '/api/auth/verify', 
    '/api/twilio/voice',
    '/api/twilio/incoming',
    '/api/twilio/dial-status',
    '/api/twilio/call-status',
    '/api/twilio/recording-status',
    '/api/health',
    '/api/twilio/incoming-call-status',
    '/api/twilio/transcribe',
    '/api/tasks/create',

  ];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // If no auth cookies and not on a public path, redirect to login
  if (!userCookie || !tokenCookie) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated, prevent access to login page
  if (pathname === '/login' && userCookie && tokenCookie) {
    const user = JSON.parse(userCookie.value);
    return NextResponse.redirect(new URL(user.redirectTo, request.url));
  }

  // Role-based access control
  if (userCookie && tokenCookie) {
    const user = JSON.parse(userCookie.value);
    
    // Admin routes protection
    if (pathname.startsWith('/admin') && user.role !== 'admin') {
      return NextResponse.redirect(new URL('/salesperson', request.url));
    }

    // Salesperson routes protection
    if (pathname.startsWith('/salesperson') && user.role !== 'salesperson') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/health).*)',
  ],
};