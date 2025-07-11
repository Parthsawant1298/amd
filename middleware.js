import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/api', '/favicon.ico', '/_next', '/public'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for userId cookie
  const userId = request.cookies.get('userId');
  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/profile',
    '/dashboard',
    '/calendar',
    // Add more protected routes as needed
  ],
}; 