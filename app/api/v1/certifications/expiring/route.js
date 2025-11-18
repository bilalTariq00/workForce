import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkExpiringCertifications, getExpiringCertificationsForEmployee } from '@/lib/services/certificationReminder';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/certifications/expiring
 * 
 * Get certifications expiring soon
 * 
 * Query parameters:
 * - employeeId: Get expiring certifications for a specific employee
 * 
 * Access:
 * - All authenticated users (for their own)
 * - HR/EHS/Admin (for all)
 */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');

    // Employees can only see their own expiring certifications
    if (employeeId && session.user.role === 'labour') {
      if (employeeId !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
          { status: 403 }
        );
      }
    }

    // If employeeId is provided, get for that employee
    if (employeeId) {
      const certifications = await getExpiringCertificationsForEmployee(employeeId);
      return NextResponse.json({
        success: true,
        data: certifications,
      });
    }

    // Otherwise, get all expiring certifications (HR/EHS/Admin only)
    if (!['hr_officer', 'ehs_officer', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        },
        { status: 403 }
      );
    }

    const result = await checkExpiringCertifications();

    return NextResponse.json({
      success: result.success,
      data: result.reminders || [],
      count: result.count || 0,
    });

  } catch (error) {
    console.error('Error fetching expiring certifications:', error);
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

