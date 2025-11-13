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

    // Validate site location
    if (!nearestSite.location || 
        nearestSite.location.latitude == null || 
        nearestSite.location.longitude == null) {
      console.error('Nearest site has invalid location:', {
        siteId: nearestSite._id,
        siteName: nearestSite.name,
        location: nearestSite.location
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SITE_LOCATION',
            message: 'Site location is not configured correctly. Please contact HR to update the site location.',
          },
        },
        { status: 400 }
      );
    }

    // Check if within radius
    const radiusCheck = isWithinRadius(
      nearestSite.location,
      userLocation,
      nearestSite.attendanceRadius
    );

    // If distance is unreasonably large, it's likely a data issue
    if (radiusCheck.distance > 1000000) { // More than 1000 km
      console.error('Unreasonably large distance detected:', {
        siteId: nearestSite._id,
        siteName: nearestSite.name,
        siteLocation: nearestSite.location,
        userLocation: userLocation,
        distance: radiusCheck.distance,
        distanceKm: (radiusCheck.distance / 1000).toFixed(2)
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SITE_LOCATION',
            message: 'Site location appears to be incorrect. Please contact HR to verify and update the site location coordinates.',
            distance: radiusCheck.distance,
          },
        },
        { status: 400 }
      );
    }

    if (!radiusCheck.isWithinRadius) {
      // Format distance nicely
      let distanceDisplay = `${radiusCheck.distance}m`;
      if (radiusCheck.distance >= 1000) {
        distanceDisplay = `${(radiusCheck.distance / 1000).toFixed(1)}km`;
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OUT_OF_RANGE',
            message: `You are ${distanceDisplay} away from ${nearestSite.name}. Please be within ${nearestSite.attendanceRadius}m of the site to mark attendance.`,
            distance: radiusCheck.distance,
            requiredRadius: nearestSite.attendanceRadius,
            siteName: nearestSite.name,
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

