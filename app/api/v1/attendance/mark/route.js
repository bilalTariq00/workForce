import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Site } from '@/lib/models/Site';
import { validateQRCode } from '@/lib/utils/qr';
import { findNearestSite, isWithinRadius } from '@/lib/utils/geolocation';
import { z } from 'zod';

const markAttendanceSchema = z.object({
  qrCode: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = markAttendanceSchema.parse(body);

    // Validate QR code
    if (!validateQRCode(validatedData.qrCode)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QR_CODE',
            message: 'Invalid QR code',
          },
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      employeeId: session.user.id,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_MARKED',
            message: 'Attendance already marked for today',
          },
          data: {
            attendanceId: existingAttendance._id,
            signInTime: existingAttendance.signInTime,
          },
        },
        { status: 409 }
      );
    }

    // Find nearest active site
    const activeSites = await Site.find({ status: 'active' }).lean();
    const userLocation = {
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
    };

    const nearestSite = findNearestSite(activeSites, userLocation);

    if (!nearestSite) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SITE_FOUND',
            message: 'No active site found nearby',
          },
        },
        { status: 404 }
      );
    }

    // Check if within radius
    const radiusCheck = isWithinRadius(
      nearestSite.location,
      userLocation,
      nearestSite.attendanceRadius
    );

    if (!radiusCheck.isWithinRadius) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OUT_OF_RANGE',
            message: `You are ${radiusCheck.distance}m away from the site. Please be within ${nearestSite.attendanceRadius}m to mark attendance.`,
            distance: radiusCheck.distance,
            requiredRadius: nearestSite.attendanceRadius,
          },
        },
        { status: 400 }
      );
    }

    // Create attendance record
    const attendance = await Attendance.create({
      employeeId: session.user.id,
      siteId: nearestSite._id,
      date: today,
      signInTime: new Date(),
      signInMethod: 'qr',
      location: {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
      },
      distanceFromSite: radiusCheck.distance,
      status: 'present',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Attendance marked successfully',
        data: {
          attendanceId: attendance._id,
          siteName: nearestSite.name,
          signInTime: attendance.signInTime,
          distance: radiusCheck.distance,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error marking attendance:', error);
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

