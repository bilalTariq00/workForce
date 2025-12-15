import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Site } from '@/lib/models/Site';
import { SiteQRToken } from '@/lib/models/SiteQRToken';
import { checkPermission } from '@/lib/middleware/permissionMiddleware';
import QRCode from 'qrcode';

/**
 * POST /api/v1/sites/[id]/qr-token/regenerate
 * 
 * Regenerate QR token for a site (invalidates old token)
 * 
 * Access: Requires 'sites' module with 'edit' action
 */
export async function POST(req, { params }) {
  try {
    // Check permission
    const permissionCheck = await checkPermission('sites', 'edit');
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

    // Regenerate token
    const newTokenDoc = await SiteQRToken.regenerateToken(siteId, permissionCheck.user._id);

    // Generate QR code image
    try {
      const qrImage = await QRCode.toDataURL(newTokenDoc.qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });
      
      newTokenDoc.qrImage = qrImage;
      await newTokenDoc.save();
    } catch (qrError) {
      console.error('Error generating QR code:', qrError);
    }

    return NextResponse.json({
      success: true,
      data: {
        token: newTokenDoc.token,
        qrData: newTokenDoc.qrData,
        qrImage: newTokenDoc.qrImage,
        siteId: siteId,
        generatedAt: newTokenDoc.generatedAt,
      },
      message: 'QR token regenerated successfully',
    });
  } catch (error) {
    console.error('Error regenerating QR token:', error);
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



