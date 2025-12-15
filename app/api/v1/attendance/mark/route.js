import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceEvent } from '@/lib/models/AttendanceEvent';
import { Site } from '@/lib/models/Site';
import { SiteQRToken } from '@/lib/models/SiteQRToken';
import { AuditLog } from '@/lib/models/AuditLog';
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

    const userLocation = {
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
    };

    // Try to parse QR code as site-specific token
    let site = null;
    let qrToken = null;
    
    try {
      const qrData = JSON.parse(validatedData.qrCode);
      if (qrData.type === 'site_attendance' && qrData.token && qrData.siteId) {
        // Site-specific QR code
        qrToken = `${qrData.siteId}_${qrData.token}`;
        site = await SiteQRToken.resolveSiteFromToken(qrToken);
        
        if (!site) {
          // Log denied scan to audit log
          await AuditLog.log({
            userId: session.user.id,
            action: 'denied_scan',
            resourceType: 'attendance',
            outcome: 'denied',
            details: {
              reason: 'invalid_qr_token',
              qrToken: qrToken,
            },
            ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            userAgent: req.headers.get('user-agent'),
            method: 'POST',
            path: '/api/v1/attendance/mark',
          });
          
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_QR_TOKEN',
                message: 'Invalid or expired QR code. Please scan a valid site QR code.',
              },
            },
            { status: 400 }
          );
        }
      }
    } catch (e) {
      // Not a site-specific QR, fall back to universal QR (backward compatibility)
    }

    // If not site-specific QR, use old method (find nearest site)
    if (!site) {
      const activeSites = await Site.find({ status: 'active' }).lean();
      site = findNearestSite(activeSites, userLocation);
    }

    if (!site) {
      // Log denied scan
      await AuditLog.log({
        userId: session.user.id,
        action: 'denied_scan',
        resourceType: 'attendance',
        outcome: 'denied',
        details: {
          reason: 'no_site_found',
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        method: 'POST',
        path: '/api/v1/attendance/mark',
      });
      
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
    if (!site.location || 
        site.location.latitude == null || 
        site.location.longitude == null) {
      console.error('Site has invalid location:', {
        siteId: site._id,
        siteName: site.name,
        location: site.location
      });
      
      // Log denied scan
      await AuditLog.log({
        userId: session.user.id,
        action: 'denied_scan',
        resourceType: 'attendance',
        outcome: 'denied',
        details: {
          reason: 'invalid_site_location',
          siteId: site._id,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        method: 'POST',
        path: '/api/v1/attendance/mark',
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
    let radiusCheck = null;

    // If site has a geofence configured, use it
    if (site.geofence && site.geofence.type) {
      isWithinGeofence = isPointInGeofence(userLocation, site.geofence);
      
      // Calculate distance for error message
      if (site.geofence.type === 'circle') {
        radiusCheck = isWithinRadius(
          site.geofence.center || site.location,
          userLocation,
          site.geofence.radius || site.attendanceRadius
        );
        distance = radiusCheck.distance;
      } else {
        // For polygon, calculate distance to center
        const siteCenter = site.geofence.center || site.location;
        radiusCheck = isWithinRadius(siteCenter, userLocation, 1000);
        distance = radiusCheck.distance;
      }
    } else {
      // Fallback to radius check (backward compatibility)
      radiusCheck = isWithinRadius(
        site.location,
        userLocation,
        site.attendanceRadius || 50 // Default 50 meters if not set
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

      const requiredRadius = site.geofence?.radius || site.attendanceRadius;

      // Log denied scan to audit log
      await AuditLog.log({
        userId: session.user.id,
        action: 'denied_scan',
        resourceType: 'attendance',
        outcome: 'denied',
        details: {
          reason: 'out_of_range',
          siteId: site._id,
          siteName: site.name,
          distance: distance,
          requiredRadius: requiredRadius,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        method: 'POST',
        path: '/api/v1/attendance/mark',
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OUT_OF_RANGE',
            message: `You are ${distanceDisplay} away from ${site.name}. Please be within the site geofence to mark attendance.`,
            distance: distance,
            requiredRadius: requiredRadius,
            siteName: site.name,
          },
        },
        { status: 400 }
      );
    }

    // Check for expired certifications (Gate Access Blocking)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
      
      // Log denied scan to audit log
      await AuditLog.log({
        userId: session.user.id,
        action: 'denied_scan',
        resourceType: 'attendance',
        outcome: 'denied',
        details: {
          reason: 'certification_expired',
          siteId: site._id,
          expiredCertifications: expiredCertifications.map((cert) => ({
            type: cert.type,
            expiryDate: cert.expiryDate,
          })),
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        method: 'POST',
        path: '/api/v1/attendance/mark',
      });
      
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

    // Determine event type (IN or OUT)
    // Check last event for this employee today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const lastEvent = await AttendanceEvent.findOne({
      employeeId: session.user.id,
      siteId: site._id,
      timestamp: {
        $gte: todayStart,
        $lte: todayEnd,
      },
      isValid: true,
    })
      .sort({ timestamp: -1 })
      .lean();
    
    // Determine event type: if last event was IN, this is OUT; otherwise IN
    const eventType = lastEvent && lastEvent.type === 'IN' ? 'OUT' : 'IN';
    
    // Create attendance event
    const attendanceEvent = await AttendanceEvent.create({
      employeeId: session.user.id,
      siteId: site._id,
      timestamp: new Date(),
      type: eventType,
      location: {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
      },
      distanceFromSite: distance,
      isValid: true,
      qrToken: qrToken,
      deviceInfo: {
        userAgent: req.headers.get('user-agent') || '',
      },
    });
    
    // Also create/update Attendance record for backward compatibility
    let attendance = await Attendance.findOne({
      employeeId: session.user.id,
      siteId: site._id,
      date: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    });
    
    if (!attendance) {
      // Create new attendance record
      attendance = await Attendance.create({
        employeeId: session.user.id,
        siteId: site._id,
        date: today,
        signInTime: eventType === 'IN' ? new Date() : null,
        signInMethod: 'qr',
        location: {
          latitude: validatedData.latitude,
          longitude: validatedData.longitude,
        },
        distanceFromSite: distance,
        status: 'present',
      });
    } else if (eventType === 'OUT' && !attendance.signOutTime) {
      // Update attendance with sign out
      attendance.signOutTime = new Date();
      attendance.signOutMethod = 'qr';
      await attendance.save();
    }

    // Log successful scan
    await AuditLog.log({
      userId: session.user.id,
      action: `attendance_${eventType.toLowerCase()}`,
      resourceType: 'attendance',
      resourceId: attendanceEvent._id,
      outcome: 'success',
      details: {
        siteId: site._id,
        siteName: site.name,
        eventType: eventType,
        distance: distance,
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
      method: 'POST',
      path: '/api/v1/attendance/mark',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Attendance ${eventType} marked successfully`,
        data: {
          eventId: attendanceEvent._id,
          attendanceId: attendance._id,
          siteName: site.name,
          eventType: eventType,
          timestamp: attendanceEvent.timestamp,
          distance: distance,
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

