/**
 * Site Permission Utilities
 * 
 * Purpose: Helper functions for checking site-specific permissions
 * Used for per-site role assignment and access control
 */

import { hasPermission, hasModulePermission } from './permissions';

/**
 * Check if user has permission for a module/action at a specific site
 * @param {Object} user - User object with roleTemplateId and assignedSites populated
 * @param {string} module - Module code
 * @param {string} action - Action
 * @param {string} siteId - Site ID
 * @returns {boolean} - True if user has permission
 */
export function hasSitePermission(user, module, action, siteId) {
  if (!user || !siteId) return false;

  // Admin always has access
  if (user.role === 'admin') {
    return true;
  }

  // Check if user is assigned to this site
  if (!user.assignedSites || user.assignedSites.length === 0) {
    return false;
  }

  const siteAssignment = user.assignedSites.find(
    (s) => s.siteId && s.siteId.toString() === siteId.toString()
  );

  if (!siteAssignment) {
    return false; // User not assigned to this site
  }

  // If site assignment has a role template, use that
  if (siteAssignment.roleTemplateId && siteAssignment.roleTemplateId.permissions) {
    return hasPermission(
      { ...user, roleTemplateId: siteAssignment.roleTemplateId },
      module,
      action
    );
  }

  // Otherwise, use user's main role template
  return hasPermission(user, module, action);
}

/**
 * Check if user has module access at a specific site
 * @param {Object} user - User object
 * @param {string} module - Module code
 * @param {string} siteId - Site ID
 * @returns {boolean} - True if user has access
 */
export function hasSiteModuleAccess(user, module, siteId) {
  if (!user || !siteId) return false;

  // Admin always has access
  if (user.role === 'admin') {
    return true;
  }

  // Check if user is assigned to this site
  if (!user.assignedSites || user.assignedSites.length === 0) {
    return false;
  }

  const siteAssignment = user.assignedSites.find(
    (s) => s.siteId && s.siteId.toString() === siteId.toString()
  );

  if (!siteAssignment) {
    return false;
  }

  // If site assignment has a role template, use that
  if (siteAssignment.roleTemplateId && siteAssignment.roleTemplateId.permissions) {
    return hasModulePermission(
      { ...user, roleTemplateId: siteAssignment.roleTemplateId },
      module
    );
  }

  // Otherwise, use user's main role template
  return hasModulePermission(user, module);
}

/**
 * Get all sites a user has access to for a module
 * @param {Object} user - User object
 * @param {string} module - Module code
 * @returns {string[]} - Array of site IDs
 */
export function getUserSitesForModule(user, module) {
  if (!user || !user.assignedSites) return [];

  // Admin has access to all sites
  if (user.role === 'admin') {
    return user.assignedSites.map((s) => s.siteId?.toString()).filter(Boolean);
  }

  const accessibleSites = [];

  user.assignedSites.forEach((siteAssignment) => {
    // Check if this site assignment grants access to the module
    let hasAccess = false;

    // If site assignment has a role template, use that
    if (siteAssignment.roleTemplateId && siteAssignment.roleTemplateId.permissions) {
      hasAccess = hasModulePermission(
        { ...user, roleTemplateId: siteAssignment.roleTemplateId },
        module
      );
    } else {
      // Otherwise, use user's main role template
      hasAccess = hasModulePermission(user, module);
    }

    if (hasAccess && siteAssignment.siteId) {
      accessibleSites.push(siteAssignment.siteId.toString());
    }
  });

  return accessibleSites;
}



