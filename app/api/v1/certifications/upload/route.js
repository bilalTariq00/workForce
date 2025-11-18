import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { uploadFile } from '@/lib/services/fileUpload';

/**
 * POST /api/v1/certifications/upload
 * 
 * Upload a certification document file
 * 
 * Uses Cloudinary (free tier) or local storage as fallback
 * 
 * Access: All authenticated users
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file provided',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid file type. Only PDF, JPG, and PNG files are allowed',
          },
        },
        { status: 400 }
      );
    }

    // Determine file extension
    const fileExtension = file.type === 'application/pdf' ? 'pdf' : 
                         file.type === 'image/jpeg' || file.type === 'image/jpg' ? 'jpg' : 'png';

    // Upload file using file upload service
    const uploadResult = await uploadFile(file, 'certifications', {
      maxSize: 5 * 1024 * 1024, // 5MB
      filename: `cert_${session.user.id}_${Date.now()}`,
      mimeType: file.type,
    });

    return NextResponse.json({
      success: true,
      data: {
        documentUrl: uploadResult.url,
        documentType: fileExtension,
        publicId: uploadResult.publicId, // For Cloudinary deletion
        format: uploadResult.format,
      },
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Handle specific error messages
    if (error.message.includes('exceeds')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while uploading file',
        },
      },
      { status: 500 }
    );
  }
}

