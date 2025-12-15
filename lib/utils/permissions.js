/**
 * Permission Utilities
 * 
 * Purpose: Helper functions for checking permissions based on role templates
 * Used throughout the application for access control
 */

/**
 * Check if a user has permission for a specific module and action
 * @param {Object} user - User object with roleTemplateId populated
 * @param {string} module - Module code (e.g., 'hrm', 'attendance')
 * @param {string} action - Action (e.g., 'view', 'create', 'edit', 'approve', 'export', 'manage')
 * @returns {boolean} - True if user has permission
 */
export function hasPermission(user, module, action) {
  if (!user) return false;

  // Check role template permissions (highest priority)
  if (user.roleTemplateId && user.roleTemplateId.permissions) {
    const permission = user.roleTemplateId.permissions.find(p => p.module === module);
    if (permission && permission.actions && permission.actions.includes(action)) {
      return true;
    }
  }

  // Fallback: Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  return false;
}

/**
 * Check if user has any permission for a module (any action)
 * @param {Object} user - User object with roleTemplateId populated
 * @param {string} module - Module code
 * @returns {boolean} - True if user has any permission for the module
 */
export function hasModulePermission(user, module) {
  if (!user) return false;

  // Check role template permissions
  if (user.roleTemplateId && user.roleTemplateId.permissions) {
    const permission = user.roleTemplateId.permissions.find(p => p.module === module);
    if (permission && permission.actions && permission.actions.length > 0) {
      return true;
    }
  }

  // Fallback: Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }

  return false;
}

/**
 * Get all actions a user can perform on a module
 * @param {Object} user - User object with roleTemplateId populated
 * @param {string} module - Module code
 * @returns {string[]} - Array of allowed actions
 */
export function getModuleActions(user, module) {
  if (!user) return [];

  // Get actions from role template
  if (user.roleTemplateId && user.roleTemplateId.permissions) {
    const permission = user.roleTemplateId.permissions.find(p => p.module === module);
    if (permission && permission.actions) {
      return permission.actions;
    }
  }

  // Fallback: Admin has all actions
  if (user.role === 'admin') {
    return ['view', 'create', 'edit', 'delete', 'approve', 'export', 'manage'];
  }

  return [];
}

/**
 * Get all modules the user has access to
 * @param {Object} user - User object with roleTemplateId populated
 * @returns {string[]} - Array of module codes
 */
export function getUserModules(user) {
  if (!user) return [];

  const modules = new Set();

  // Get modules from role template
  if (user.roleTemplateId && user.roleTemplateId.permissions) {
    user.roleTemplateId.permissions.forEach(p => {
      if (p.module && p.actions && p.actions.length > 0) {
        modules.add(p.module);
      }
    });
  }

  // Fallback: Admin has all modules
  if (user.role === 'admin') {
    return [
      'hrm',
      'registers',
      'process_management',
      'finance_payroll',
      'equipment',
      'procurement',
      'attendance',
      'certifications',
      'timesheets',
      'leave_requests',
      'sites',
      'reports',
    ];
  }

  return Array.from(modules);
}

/**
 * Check if user can perform action on a resource (for site-specific permissions)
 * @param {Object} user - User object
 * @param {string} module - Module code
 * @param {string} action - Action
 * @param {string} siteId - Site ID (optional, for site-specific checks)
 * @returns {boolean} - True if user has permission
 */
export function canPerformAction(user, module, action, siteId = null) {
  // First check general permission
  if (!hasPermission(user, module, action)) {
    return false;
  }

  // If siteId provided, check site-specific permissions
  // This will be enhanced in Milestone 1.3 with site-specific role assignments
  if (siteId && user.assignedSites) {
    // Check if user is assigned to this site
    const siteAssignment = user.assignedSites.find(s => s.siteId === siteId);
    if (!siteAssignment) {
      return false; // User not assigned to this site
    }
  }

  return true;
}



