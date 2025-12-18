import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow public endpoints without authentication
    const publicPaths = ['/api/v1/init', '/api/test-connection', '/api/debug-auth'];
    if (publicPaths.includes(req.nextUrl.pathname)) {
      return NextResponse.next();
    }
    
    // For API routes, let them handle their own authentication
    // getServerSession in API routes will check authentication
    // Don't block here - let the API route handler decide
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }
    
    // If user has token, allow access
    if (req.nextauth.token) {
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
        // Allow login page itself
        if (req.nextUrl.pathname === '/login') {
          return true;
        }
        // For API routes, always return true to prevent redirects
        // The middleware function will handle authentication and return 401 if needed
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return true;
        }
        // Require token for other paths (pages)
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/hr/:path*',
    '/labour/:path*',
    '/site-manager/:path*',
    '/contracts-manager/:path*',
    '/ehs/:path*',
    '/dashboard/:path*',
    '/modules/:path*',
    '/modules-dashboard/:path*',
    '/registers/:path*',
    '/procurement/:path*',
    '/attendance/:path*',
    '/qr-display/:path*',
    '/api/v1/:path*',
  ],
};

