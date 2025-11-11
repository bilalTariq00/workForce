import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Check if user has marked attendance today
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    })
      .populate('siteId', 'name siteCode')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        marked: !!attendance,
        attendance: attendance || null,
      },
    });
  } catch (error) {
    console.error('Error checking attendance:', error);
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

