import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { SiteQRToken } from '@/lib/models/SiteQRToken';

/**
 * GET /api/v1/sites/resolve-token
 * 
 * Resolve site from QR token
 * 
 * Query parameters:
 * - token: QR token string
 * 
 * Access: Public (used for QR scanning)
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: 'MISSING_TOKEN', message: 'Token is required' } },
        { status: 400 }
      );
    }

    // Resolve site from token
    const site = await SiteQRToken.resolveSiteFromToken(token);

    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired QR token' } },
        { status: 404 }
      );
    }

    // Get the token document for additional info
    const tokenDoc = await SiteQRToken.findOne({ token, isActive: true }).lean();

    return NextResponse.json({
      success: true,
      data: {
        site: {
          _id: site._id,
          name: site.name,
          siteCode: site.siteCode,
          attendanceRadius: site.attendanceRadius || 50,
        },
        token: tokenDoc?.token,
      },
    });
  } catch (error) {
    console.error('Error resolving QR token:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while resolving token',
        },
      },
      { status: 500 }
    );
  }
}

