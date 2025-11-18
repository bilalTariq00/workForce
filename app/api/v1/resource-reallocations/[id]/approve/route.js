import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ResourceReallocation } from '@/lib/models/ResourceReallocation';
import { Employee } from '@/lib/models/Employee';
import { z } from 'zod';

/**
 * Validation schema for approving/rejecting reallocations
 */
const approveReallocationSchema = z.object({
  action: z.enum(['approve', 'reject']),
  approvalNotes: z.string().max(1000).optional(),
  rejectionReason: z.string().max(1000).optional(),
});

/**
 * POST /api/v1/resource-reallocations/[id]/approve
 * 
 * Approve or reject a resource reallocation
 * 
 * Access:
 * - Contracts Managers/HR/Admin only
 * 
 * When approved:
 * - For crew: Employees are moved to the new site
 * - For plant/equipment: Record is updated (actual implementation depends on plant tracking system)
 */
export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Contracts Managers, HR, and Admin can approve/reject
    if (
      !['contracts_manager', 'hr_officer', 'admin'].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only Contracts Managers can approve/reject resource reallocations',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    const reallocation = await ResourceReallocation.findById(params.id);

    if (!reallocation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource reallocation not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only approve/reject pending reallocations
    if (!reallocation.canApprove()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Can only approve/reject pending reallocations',
          },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = approveReallocationSchema.parse(body);

    // Update reallocation status
    if (validatedData.action === 'approve') {
      reallocation.status = 'approved';
      reallocation.approvedBy = session.user.id;
      reallocation.approvedAt = new Date();
      reallocation.approvalNotes = validatedData.approvalNotes || '';
      reallocation.rejectionReason = undefined;

      // Move employees to new site (for crew reallocation)
      if (reallocation.resourceType === 'crew' && reallocation.employeeIds.length > 0) {
        await Employee.updateMany(
          { _id: { $in: reallocation.employeeIds } },
          { $set: { siteId: reallocation.toSiteId } }
        );
      }

      // Note: For plant/equipment, actual implementation would depend on plant tracking system
      // This is a placeholder - in production, you'd update a Plant/Equipment model
    } else if (validatedData.action === 'reject') {
      reallocation.status = 'rejected';
      reallocation.approvedBy = session.user.id;
      reallocation.approvedAt = new Date();
      reallocation.rejectionReason =
        validatedData.rejectionReason || 'Rejected by Contracts Manager';
      reallocation.approvalNotes = validatedData.approvalNotes || '';
    }

    await reallocation.save();

    await reallocation.populate('fromSiteId', 'name siteCode');
    await reallocation.populate('toSiteId', 'name siteCode');
    await reallocation.populate('employeeIds', 'firstName lastName employeeId');
    await reallocation.populate('requestedBy', 'firstName lastName employeeId');
    await reallocation.populate('approvedBy', 'firstName lastName employeeId');

    return NextResponse.json({
      success: true,
      data: reallocation,
      message: `Resource reallocation ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });

  } catch (error) {
    console.error('Error approving resource reallocation:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
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
          message: 'An error occurred while processing resource reallocation',
        },
      },
      { status: 500 }
    );
  }
}

