/**
 * Navigation Utilities
 * 
 * Purpose: Map routes to modules and filter menu items based on permissions
 */

// Map of routes to module codes
export const ROUTE_MODULE_MAP = {
  '/hr/dashboard': 'hrm',
  '/hr/employees': 'hrm',
  '/hr/create-employee': 'hrm',
  '/hr/sites': 'sites',
  '/hr/tools': 'equipment',
  '/hr/equipment': 'equipment',
  '/hr/timesheets': 'timesheets',
  '/hr/leave-requests': 'leave_requests',
  '/hr/certifications': 'certifications',
  '/hr/payroll': 'finance_payroll',
  '/hr/reports': 'reports',
  '/hr/settings': 'hrm',
  '/hr/settings/permission-templates': 'hrm',
  '/attendance/scan': 'attendance',
  '/attendance/certifications': 'certifications',
  '/attendance/leave-request': 'leave_requests',
  '/attendance/incidents': 'reports',
  '/site-manager/dashboard': 'process_management',
  '/site-manager/daily-logs': 'process_management',
  '/site-manager/attendance-verification': 'attendance',
  '/site-manager/variations': 'process_management',
  '/site-manager/timesheets': 'timesheets',
  '/contracts-manager/dashboard': 'sites',
  '/contracts-manager/resource-allocation': 'process_management',
  '/contracts-manager/alerts': 'sites',
  '/contracts-manager/variations': 'process_management',
  '/contracts-manager/reports': 'reports',
  '/ehs/dashboard': 'certifications',
  '/ehs/incidents': 'reports',
  '/ehs/inspections': 'reports',
  '/ehs/training': 'reports',
  '/procurement': 'procurement',
  '/chat': null, // Chat is available to all authenticated users
  '/hr/qr-display': 'attendance',
  '/admin/role-templates': null, // Admin/HR only - no module check needed
};

/**
 * Check if a route requires module access
 * @param {string} route - Route path
 * @returns {string|null} - Module code or null if no module required
 */
export function getModuleForRoute(route) {
  // Check exact match first
  if (ROUTE_MODULE_MAP[route]) {
    return ROUTE_MODULE_MAP[route];
  }

  // Check if route starts with any mapped route
  for (const [mappedRoute, module] of Object.entries(ROUTE_MODULE_MAP)) {
    if (route.startsWith(mappedRoute)) {
      return module;
    }
  }

  return null;
}

import { hasModuleAccess } from '@/lib/config/modules';

/**
 * Filter menu items based on user permissions
 * @param {Array} menuItems - Array of menu items with href property
 * @param {Object} user - User object with roleTemplateId populated
 * @returns {Array} - Filtered menu items
 */
export function filterMenuItemsByPermissions(menuItems, user) {
  if (!user) return [];

  return menuItems.filter((item) => {
    // Special handling for admin routes - allow admin and hr_officer roles
    if (item.href.startsWith('/admin/')) {
      // Check both role and ensure it's a valid admin/hr role
      const isAdmin = user.role === 'admin';
      const isHROfficer = user.role === 'hr_officer';
      return isAdmin || isHROfficer;
    }

    const module = getModuleForRoute(item.href);
    
    // If no module required, allow access (e.g., chat, dashboard)
    if (!module) {
      return true;
    }

    // Check if user has access to this module
    return hasModuleAccess(user, module);
  });
}

