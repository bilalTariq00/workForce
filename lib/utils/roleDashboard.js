/**
 * Get the dashboard route for a specific role
 * @param {string} role - User role
 * @param {Object} roleTemplate - Optional role template object with baseRole
 * @returns {string} Dashboard route
 */
export function getRoleDashboard(role, roleTemplate = null) {
  // If user has a custom role template, check if it has a baseRole
  // Custom templates should route to their base role dashboard
  if (roleTemplate && roleTemplate.baseRole) {
    role = roleTemplate.baseRole;
  }

  const roleDashboardMap = {
    labour: '/labour/dashboard',
    site_manager: '/site-manager/dashboard',
    contracts_manager: '/contracts-manager/dashboard',
    hr_officer: '/hr/dashboard',
    ehs_officer: '/ehs/dashboard',
    admin: '/modules-dashboard', // Only admin goes to modules dashboard
  };

  // If role is in the map, return the specific dashboard
  if (roleDashboardMap[role]) {
    return roleDashboardMap[role];
  }

  // For custom roles or unknown roles, use generic dashboard
  // The generic dashboard will show widgets based on permissions
  return '/dashboard';
}

/**
 * Check if user should be redirected to role-specific dashboard
 * @param {string} role - User role
 * @returns {boolean} True if should redirect to role dashboard
 */
export function shouldRedirectToRoleDashboard(role) {
  // All roles except admin should go to their role-specific dashboard
  // Admin goes to modules-dashboard
  return role && role !== 'admin';
}

