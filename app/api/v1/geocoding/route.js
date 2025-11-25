import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geocodeAddress, geocodeStructuredAddress, reverseGeocode } from '@/lib/utils/geocoding';
import { z } from 'zod';

const geocodeSchema = z.object({
  address: z.string().min(1).optional(),
  structuredAddress: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});

const reverseGeocodeSchema = z.object({
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

    // Only HR, Admin, and Site Managers can geocode
    if (
      session.user.role !== 'hr_officer' &&
      session.user.role !== 'admin' &&
      session.user.role !== 'site_manager'
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { address, structuredAddress, latitude, longitude } = body;

    // Handle reverse geocoding
    if (latitude != null && longitude != null) {
      const validatedData = reverseGeocodeSchema.parse({ latitude, longitude });
      const result = await reverseGeocode(validatedData.latitude, validatedData.longitude);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Handle forward geocoding
    const validatedData = geocodeSchema.parse({ address, structuredAddress });

    let result;
    if (validatedData.address) {
      result = await geocodeAddress(validatedData.address);
    } else if (validatedData.structuredAddress) {
      result = await geocodeStructuredAddress(validatedData.structuredAddress);
    } else {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Address or structuredAddress is required' } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Geocoding API error:', error);

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

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'GEOCODING_ERROR',
          message: error.message || 'Failed to geocode address',
        },
      },
      { status: 500 }
    );
  }
}


