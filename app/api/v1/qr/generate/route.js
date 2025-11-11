import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UNIVERSAL_QR_CODE } from '@/lib/utils/qr';
import QRCode from 'qrcode';

// Generate universal QR code image
// Public endpoint - no auth required (for displaying QR on laptop)
export async function GET() {
  try {
    // No authentication required - QR code is public

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(UNIVERSAL_QR_CODE, {
      width: 400,
      margin: 2,
    });

    return NextResponse.json({
      success: true,
      data: {
        qrCode: UNIVERSAL_QR_CODE,
        qrCodeImage: qrCodeDataUrl,
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
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

