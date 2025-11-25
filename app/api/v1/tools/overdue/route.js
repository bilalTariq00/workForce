import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { ToolAssignment } from '@/lib/models/ToolAssignment';

// GET - Get overdue tool assignments and send notifications
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();

    // Find all overdue assignments
    const overdueAssignments = await ToolAssignment.find({
      status: { $in: ['assigned', 'overdue'] },
      expectedReturnDate: { $lt: now },
    })
      .populate('toolId', 'name category brand model finePerDay')
      .populate('employeeId', 'firstName lastName employeeId email phone')
      .populate('assignedBy', 'firstName lastName employeeId')
      .sort({ expectedReturnDate: 1 });

    // Update status to overdue
    if (overdueAssignments.length > 0) {
      await ToolAssignment.updateMany(
        {
          _id: { $in: overdueAssignments.map((a) => a._id) },
          status: 'assigned',
        },
        { $set: { status: 'overdue' } }
      );
    }

    // Calculate fines for each overdue assignment
    const overdueWithFines = overdueAssignments.map((assignment) => {
      const daysLate = Math.ceil(
        (now - new Date(assignment.expectedReturnDate)) / (1000 * 60 * 60 * 24)
      );
      const finePerDay = assignment.toolId?.finePerDay || 0;
      const calculatedFine = daysLate > 1 ? daysLate * finePerDay * assignment.quantity : 0;

      return {
        ...assignment.toObject(),
        daysLate,
        calculatedFine,
      };
    });

    // Group by employee
    const byEmployee = {};
    overdueWithFines.forEach((assignment) => {
      const empId = assignment.employeeId._id.toString();
      if (!byEmployee[empId]) {
        byEmployee[empId] = {
          employee: assignment.employeeId,
          assignments: [],
          totalFine: 0,
        };
      }
      byEmployee[empId].assignments.push(assignment);
      byEmployee[empId].totalFine += assignment.calculatedFine;
    });

    return NextResponse.json({
      success: true,
      data: {
        overdueAssignments: overdueWithFines,
        byEmployee: Object.values(byEmployee),
        stats: {
          total: overdueWithFines.length,
          totalFines: overdueWithFines.reduce((sum, a) => sum + a.calculatedFine, 0),
          employeesAffected: Object.keys(byEmployee).length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching overdue tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overdue tools', message: error.message },
      { status: 500 }
    );
  }
}

