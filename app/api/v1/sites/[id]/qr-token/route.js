import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { SiteQRToken } from '@/lib/models/SiteQRToken';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import QRCode from 'qrcode';

/**
 * GET /api/v1/sites/[id]/qr-token
 * 
 * Get QR token for a site (generates if doesn't exist)
 * 
 * Access: Requires 'sites' module with 'view' action
 */
export async function GET(req, { params }) {
  try {
    // Check permission
    const permissionCheck = await checkPermission('sites', 'view');
    if (permissionCheck.error) {
      return NextResponse.json(
        { success: false, error: permissionCheck.error },
        { status: permissionCheck.status }
      );
    }

    await connectDB();

    const siteId = params.id;

    // Verify site exists
    const site = await Site.findById(siteId);
    if (!site) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Site not found' } },
        { status: 404 }
      );
    }

    // Get or create token
    const tokenDoc = await SiteQRToken.getOrCreateToken(siteId, permissionCheck.user._id);

    // Generate QR code image if not exists
    if (!tokenDoc.qrImage) {
      try {
        const qrImage = await QRCode.toDataURL(tokenDoc.qrData, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 1,
        });
        
        tokenDoc.qrImage = qrImage;
        await tokenDoc.save();
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        token: tokenDoc.token,
        qrData: tokenDoc.qrData,
        qrImage: tokenDoc.qrImage,
        siteId: siteId,
        generatedAt: tokenDoc.generatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching QR token:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}



