/**
 * Permission Middleware Helpers
 * 
 * Purpose: Helper functions to check permissions in API routes
 * Uses role template permissions for access control
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/mongodb';
import mongoose from 'mongoose';
import { Employee } from '@/lib/models/Employee';
import { RoleTemplate } from '@/lib/models/RoleTemplate';
import { hasPermission, hasModulePermission } from '@/lib/utils/permissions';
import { NextResponse } from 'next/server';

/**
 * Check if user has permission and return user object or error response
 * @param {string} module - Module code
 * @param {string} action - Action (view, create, edit, delete, approve, export, manage)
 * @returns {Promise<{user: Object|null, error: Object|null, status: number}>}
 */
export async function checkPermission(module, action) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      status: 401,
    };
  }

  await connectDB();

  // Ensure RoleTemplate model is registered before populate
  // Import and access the model to ensure it's registered
  if (!RoleTemplate || typeof RoleTemplate !== 'function') {
    // Force model registration by importing again
    const { RoleTemplate: RT } = await import('@/lib/models/RoleTemplate');
    if (RT) {
      // Model will be registered
    }
  }

  // Admin always has access
  if (session.user.role === 'admin') {
    const user = await Employee.findById(session.user.id)
      .populate('roleTemplateId')
      .lean();
    return { user, error: null, status: 200 };
  }

  // Get user with role template populated
  const user = await Employee.findById(session.user.id)
    .populate('roleTemplateId')
    .lean();

  if (!user) {
    return {
      user: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      status: 404,
    };
  }

  // Check permission using template
  const hasAccess = hasPermission(user, module, action);

  if (!hasAccess) {
    return {
      user: null,
      error: {
        code: 'FORBIDDEN',
        message: `Insufficient permissions. Required: ${module}:${action}`,
      },
      status: 403,
    };
  }

  return { user, error: null, status: 200 };
}

/**
 * Check if user has module access
 * @param {string} module - Module code
 * @returns {Promise<{user: Object|null, error: Object|null, status: number}>}
 */
export async function checkModuleAccess(module) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      user: null,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      status: 401,
    };
  }

  await connectDB();

  // Ensure RoleTemplate model is registered before populate
  // Import and access the model to ensure it's registered
  if (!RoleTemplate || typeof RoleTemplate !== 'function') {
    // Force model registration by importing again
    const { RoleTemplate: RT } = await import('@/lib/models/RoleTemplate');
    if (RT) {
      // Model will be registered
    }
  }

  // Admin always has access
  if (session.user.role === 'admin') {
    const user = await Employee.findById(session.user.id)
      .populate('roleTemplateId')
      .lean();
    return { user, error: null, status: 200 };
  }

  // Get user with role template populated
  const user = await Employee.findById(session.user.id)
    .populate('roleTemplateId')
    .lean();

  if (!user) {
    return {
      user: null,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      status: 404,
    };
  }

  // Check module access
  const hasAccess = hasModulePermission(user, module);

  if (!hasAccess) {
    return {
      user: null,
      error: {
        code: 'FORBIDDEN',
        message: `Insufficient permissions for module: ${module}`,
      },
      status: 403,
    };
  }

  return { user, error: null, status: 200 };
}

