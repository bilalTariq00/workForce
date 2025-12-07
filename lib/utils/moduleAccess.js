import { hasModuleAccess, getUserModuleCodes } from '@/lib/config/modules';

/**
 * Check if user has access to a specific module
 * @param {Object} user - User object from session
 * @param {string} moduleCode - Module code to check
 * @returns {boolean}
 */
export function checkModuleAccess(user, moduleCode) {
  if (!user || !moduleCode) return false;
  return hasModuleAccess(user, moduleCode);
}

/**
 * Get module code from route path
 * Maps routes to module codes
 */
const routeToModuleMap = {
  '/hr': 'hrm',
  '/hr/': 'hrm',
  '/registers': 'registers',
  '/registers/': 'registers',
  '/site-manager': 'process_management',
  '/site-manager/': 'process_management',
  '/hr/payroll': 'finance_payroll',
  '/hr/payroll/': 'finance_payroll',
  '/hr/tools': 'equipment',
  '/hr/tools/': 'equipment',
  '/procurement': 'procurement',
  '/procurement/': 'procurement',
};

/**
 * Get module code from a route path
 * @param {string} pathname - Route path
 * @returns {string|null} Module code or null
 */
export function getModuleCodeFromRoute(pathname) {
  // Check exact matches first
  if (routeToModuleMap[pathname]) {
    return routeToModuleMap[pathname];
  }

  // Check if path starts with any route
  for (const [route, moduleCode] of Object.entries(routeToModuleMap)) {
    if (pathname.startsWith(route)) {
      return moduleCode;
    }
  }

  return null;
}

/**
 * Check if user has access to a route based on module access
 * @param {Object} user - User object from session
 * @param {string} pathname - Route path
 * @returns {boolean}
 */
export function hasRouteAccess(user, pathname) {
  const moduleCode = getModuleCodeFromRoute(pathname);
  if (!moduleCode) {
    // Route doesn't require module access
    return true;
  }
  return checkModuleAccess(user, moduleCode);
}


