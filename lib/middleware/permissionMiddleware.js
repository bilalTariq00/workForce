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
import { cookies } from 'next/headers';

/**
 * Check if user has permission and return user object or error response
 * @param {string} module - Module code
 * @param {string} action - Action (view, create, edit, delete, approve, export, manage)
 * @param {Object} session - Session object from getServerSession (optional, will try to get if not provided)
 * @returns {Promise<{user: Object|null, error: Object|null, status: number}>}
 */
export async function checkPermission(module, action, session = null) {
  // If session not provided, try to get it from cookies
  if (!session) {
    try {
      const cookieStore = await cookies();
      // Get the NextAuth session token cookie
      const sessionToken = cookieStore.get('next-auth.session-token') || 
                          cookieStore.get('__Secure-next-auth.session-token');
      
      if (!sessionToken) {
        return {
          user: null,
          error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
          status: 401,
        };
      }
      
      // Try to get session using getServerSession with cookies
      const cookieHeader = Array.from(cookieStore.getAll())
        .map(c => `${c.name}=${c.value}`)
        .join('; ');
      
      const mockReq = {
        headers: new Headers({
          'cookie': cookieHeader,
        }),
      };
      
      session = await getServerSession(authOptions, {
        req: mockReq,
      });
    } catch (error) {
      console.error('Error getting session in checkPermission:', error);
      return {
        user: null,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
        status: 401,
      };
    }
  }

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
 * @param {Request} req - Optional request object for reading cookies in App Router
 * @returns {Promise<{user: Object|null, error: Object|null, status: number}>}
 */
export async function checkModuleAccess(module, req = null) {
  // In App Router API routes, getServerSession needs access to cookies
  // Try to get cookies from next/headers first (works in App Router)
  let session;
  try {
    const cookieStore = await cookies();
    // Format cookies as a cookie header string
    const cookieHeader = Array.from(cookieStore.getAll())
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
    
    // Create a request-like object with headers
    const mockReq = {
      headers: {
        get: (name) => {
          if (name.toLowerCase() === 'cookie') {
            return cookieHeader;
          }
          return null;
        },
      },
    };
    
    session = await getServerSession(authOptions, {
      req: mockReq,
    });
  } catch (error) {
    // If cookies() fails (e.g., not in App Router context), try with provided req
    if (req) {
      const cookieHeader = req.headers.get('cookie') || '';
      const mockReq = {
        headers: {
          get: (name) => {
            if (name.toLowerCase() === 'cookie') {
              return cookieHeader;
            }
            return req.headers.get(name);
          },
        },
      };
      session = await getServerSession(authOptions, {
        req: mockReq,
      });
    } else {
      // Last resort: try without request (might not work)
      session = await getServerSession(authOptions);
    }
  }

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

