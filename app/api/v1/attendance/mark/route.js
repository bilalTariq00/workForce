import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { Site } from '@/lib/models/Site';
import { EmployeeCertificate } from '@/lib/models/EmployeeCertificate';
import { validateQRCode } from '@/lib/utils/qr';
import { findNearestSite, isWithinRadius } from '@/lib/utils/geolocation';
import { isPointInGeofence } from '@/lib/utils/geofence';
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

    // Check if within geofence (or fallback to radius check)
    let isWithinGeofence = false;
    let distance = null;

    // If site has a geofence configured, use it
    if (nearestSite.geofence && nearestSite.geofence.type) {
      isWithinGeofence = isPointInGeofence(userLocation, nearestSite.geofence);
      
      // Calculate distance for error message
      if (nearestSite.geofence.type === 'circle') {
        const radiusCheck = isWithinRadius(
          nearestSite.geofence.center || nearestSite.location,
          userLocation,
          nearestSite.geofence.radius || nearestSite.attendanceRadius
        );
        distance = radiusCheck.distance;
      } else {
        // For polygon, calculate distance to center
        const siteCenter = nearestSite.geofence.center || nearestSite.location;
        const radiusCheck = isWithinRadius(siteCenter, userLocation, 1000);
        distance = radiusCheck.distance;
      }
    } else {
      // Fallback to radius check (backward compatibility)
      const radiusCheck = isWithinRadius(
        nearestSite.location,
        userLocation,
        nearestSite.attendanceRadius
      );
      isWithinGeofence = radiusCheck.isWithinRadius;
      distance = radiusCheck.distance;
    }

    // If distance is unreasonably large, it's likely a data issue
    if (distance > 1000000) { // More than 1000 km
      console.error('Unreasonably large distance detected:', {
        siteId: nearestSite._id,
        siteName: nearestSite.name,
        siteLocation: nearestSite.location,
        userLocation: userLocation,
        distance: distance,
        distanceKm: (distance / 1000).toFixed(2)
      });
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SITE_LOCATION',
            message: 'Site location appears to be incorrect. Please contact HR to verify and update the site location coordinates.',
            distance: distance,
          },
        },
        { status: 400 }
      );
    }

    if (!isWithinGeofence) {
      // Format distance nicely
      let distanceDisplay = `${distance}m`;
      if (distance >= 1000) {
        distanceDisplay = `${(distance / 1000).toFixed(1)}km`;
      }

      const requiredRadius = nearestSite.geofence?.radius || nearestSite.attendanceRadius;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OUT_OF_RANGE',
            message: `You are ${distanceDisplay} away from ${nearestSite.name}. Please be within the site geofence to mark attendance.`,
            distance: distance,
            requiredRadius: requiredRadius,
            siteName: nearestSite.name,
          },
        },
        { status: 400 }
      );
    }

    // Check for expired certifications (Gate Access Blocking)
    // Reuse the 'today' variable defined earlier (line 49)
    const todayForCert = new Date(today);
    todayForCert.setHours(0, 0, 0, 0);

    const expiredCertifications = await EmployeeCertificate.find({
      employeeId: session.user.id,
      $or: [
        { status: 'expired' },
        {
          status: { $in: ['valid', 'pending_validation', 'expiring_soon'] },
          expiryDate: { $lt: todayForCert },
        },
      ],
    }).lean();

    if (expiredCertifications.length > 0) {
      const expiredTypes = expiredCertifications.map((cert) => cert.type).join(', ');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CERTIFICATION_EXPIRED',
            message: `Access denied: You have expired certifications (${expiredTypes}). Please renew your certifications before accessing the site.`,
            expiredCertifications: expiredCertifications.map((cert) => ({
              type: cert.type,
              expiryDate: cert.expiryDate,
            })),
          },
        },
        { status: 403 }
      );
    }

    // Check for required certifications (optional - can be configured per site)
    // For now, we'll just check if they have at least one valid certification
    const validCertifications = await EmployeeCertificate.find({
      employeeId: session.user.id,
      status: { $in: ['valid', 'expiring_soon'] },
      expiryDate: { $gte: todayForCert },
    }).lean();

    // Optional: Require specific certifications (e.g., SafePass) for site access
    // This can be configured per site or globally
    // For now, we'll just log a warning if no valid certifications exist
    if (validCertifications.length === 0) {
      console.warn(`Employee ${session.user.id} has no valid certifications but attempting site access`);
      // Uncomment below to block access if no valid certifications
      // return NextResponse.json(
      //   {
      //     success: false,
      //     error: {
      //       code: 'NO_VALID_CERTIFICATION',
      //       message: 'Access denied: You must have at least one valid certification to access the site.',
      //     },
      //   },
      //   { status: 403 }
      // );
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

