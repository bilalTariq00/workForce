/**
 * Get the dashboard route for a specific role
 * @param {string} role - User role
 * @returns {string} Dashboard route
 */
export function getRoleDashboard(role) {
  const roleDashboardMap = {
    labour: '/labour/dashboard',
    site_manager: '/site-manager/dashboard',
    contracts_manager: '/contracts-manager/dashboard',
    hr_officer: '/hr/dashboard',
    ehs_officer: '/ehs/dashboard', // Assuming EHS dashboard exists
    admin: '/modules-dashboard', // Only admin goes to modules dashboard
  };

  return roleDashboardMap[role] || '/dashboard';
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

