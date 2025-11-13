import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import { Alert } from '@/lib/models/Alert';
import { generateAlertsForAllSites } from '@/lib/services/alertEngine';
import { z } from 'zod';

/**
 * GET /api/v1/alerts
 * 
 * List all alerts with optional filters
 * 
 * Query parameters:
 * - siteId: Filter by site
 * - type: Filter by alert type
 * - severity: Filter by severity (critical, warning, info)
 * - status: Filter by status (active, acknowledged, resolved)
 * 
 * Access: Contracts Manager, Admin only
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

    // Only Contracts Managers and Admin can access
    if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');

    const query = {};

    // Apply filters
    if (siteId) {
      query.siteId = siteId;
    }

    if (type) {
      query.type = type;
    }

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    // Fetch alerts with populated references
    const alerts = await Alert.find(query)
      .populate('siteId', 'name siteCode')
      .populate('acknowledgedBy', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ severity: 1, generatedAt: -1 }) // Critical first, then by date
      .lean();

    // Get counts
    const activeCount = await Alert.countDocuments({ ...query, status: 'active' });
    const criticalCount = await Alert.countDocuments({
      ...query,
      severity: 'critical',
      status: 'active',
    });
    const warningCount = await Alert.countDocuments({
      ...query,
      severity: 'warning',
      status: 'active',
    });

    return NextResponse.json({
      success: true,
      data: alerts,
      counts: {
        total: alerts.length,
        active: activeCount,
        critical: criticalCount,
        warning: warningCount,
      },
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching alerts',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/alerts/generate
 * 
 * Manually trigger alert generation for all sites
 * 
 * Access: Contracts Manager, Admin only
 */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Only Contracts Managers and Admin can generate alerts
    if (session.user.role !== 'contracts_manager' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { action } = body;

    if (action === 'generate') {
      // Generate alerts for all sites
      const alerts = await generateAlertsForAllSites();

      return NextResponse.json({
        success: true,
        data: {
          alertsGenerated: alerts.length,
          alerts,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid action. Use { "action": "generate" }',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error generating alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'An error occurred while generating alerts',
        },
      },
      { status: 500 }
    );
  }
}

