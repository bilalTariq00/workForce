import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow public endpoints without authentication
    const publicPaths = ['/api/v1/init', '/api/test-connection', '/api/debug-auth'];
    if (publicPaths.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/login',
    },
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public paths
        const publicPaths = ['/api/v1/init', '/api/test-connection', '/api/debug-auth', '/api/v1/qr/generate'];
        if (publicPaths.includes(req.nextUrl.pathname)) {
          return true;
        }
        // Allow attendance scan page (will check auth in component)
        if (req.nextUrl.pathname.startsWith('/attendance/scan')) {
          return true;
        }
        // Allow public QR display page (no auth needed)
        if (req.nextUrl.pathname === '/qr-display/public') {
          return true;
        }
        // Require token for other paths
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/hr/:path*',
    '/dashboard/:path*',
    '/attendance/:path*',
    '/qr-display/:path*',
    '/api/v1/:path*',
  ],
};

