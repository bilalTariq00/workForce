import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { calculatePayrollForTimesheets } from '@/lib/services/payrollCalculator';
import { exportToSageCSV, exportToSageJSON } from '@/lib/services/sageExport';
import mongoose from 'mongoose';

/**
 * POST /api/v1/payroll-runs/[id]/export
 * 
 * Export payroll run to Sage format
 * 
 * Query parameters:
 * - format: csv or json (default: csv)
 * 
 * Access: HR Officers, Admin
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

    // Only HR and Admin can export payroll
    if (session.user.role !== 'hr_officer' && session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only HR Officers and Admin can export payroll',
          },
        },
        { status: 403 }
      );
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid payroll run ID',
          },
        },
        { status: 400 }
      );
    }

    const payrollRun = await PayrollRun.findById(params.id);

    if (!payrollRun) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payroll run not found',
          },
        },
        { status: 404 }
      );
    }

    if (payrollRun.status !== 'calculated') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Payroll must be calculated before export',
          },
        },
        { status: 400 }
      );
    }

    // Get format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';

    // Calculate payroll data
    const payrollData = await calculatePayrollForTimesheets(payrollRun.timesheets);

    // Export based on format
    let exportData;
    let contentType;
    let fileName;

    if (format === 'json') {
      exportData = exportToSageJSON(payrollData, payrollRun);
      contentType = 'application/json';
      fileName = `payroll-${payrollRun._id}-${formatDateForFilename(payrollRun.periodStart)}.json`;
    } else {
      exportData = exportToSageCSV(payrollData, payrollRun);
      contentType = 'text/csv';
      fileName = `payroll-${payrollRun._id}-${formatDateForFilename(payrollRun.periodStart)}.csv`;
    }

    // Mark as exported
    await payrollRun.markExported(
      `/exports/${fileName}`, // In production, this would be a real file URL
      fileName
    );

    // Return export data
    return new NextResponse(exportData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting payroll:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Format date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

