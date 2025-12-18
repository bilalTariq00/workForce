/**
 * Dashboard Permissions Utilities
 * 
 * Purpose: Helper functions for building permission-aware dashboards
 * Used to filter dashboard content based on role template permissions
 */

import { hasPermission, hasModulePermission, getUserModules } from './permissions';
import { hasModuleAccess } from '@/lib/config/modules';

/**
 * Get dashboard widgets based on user permissions
 * @param {Object} user - User object with roleTemplateId populated
 * @param {Array} widgetConfigs - Array of widget configurations
 * @returns {Array} - Filtered array of widgets user has access to
 */
export function getAvailableWidgets(user, widgetConfigs) {
  if (!user || !widgetConfigs) return [];

  return widgetConfigs.filter(widget => {
    // If widget has no permission requirement, show it
    if (!widget.requiredPermission && !widget.requiredModule) {
      return true;
    }

    // Check module-level access
    if (widget.requiredModule) {
      return hasModuleAccess(user, widget.requiredModule);
    }

    // Check specific permission
    if (widget.requiredPermission) {
      const [module, action] = widget.requiredPermission.split(':');
      return hasPermission(user, module, action);
    }

    return false;
  });
}

/**
 * Get quick actions based on user permissions
 * @param {Object} user - User object with roleTemplateId populated
 * @param {Array} actionConfigs - Array of action configurations
 * @returns {Array} - Filtered array of actions user can perform
 */
export function getAvailableQuickActions(user, actionConfigs) {
  if (!user || !actionConfigs) return [];

  return actionConfigs.filter(action => {
    // If action has no permission requirement, show it
    if (!action.requiredPermission && !action.requiredModule) {
      return true;
    }

    // Check module-level access
    if (action.requiredModule) {
      return hasModuleAccess(user, action.requiredModule);
    }

    // Check specific permission (can be array for multiple options)
    if (action.requiredPermission) {
      if (Array.isArray(action.requiredPermission)) {
        // User needs at least one of the permissions
        return action.requiredPermission.some(perm => {
          const [module, action] = perm.split(':');
          return hasPermission(user, module, action);
        });
      } else {
        const [module, action] = action.requiredPermission.split(':');
        return hasPermission(user, module, action);
      }
    }

    return false;
  });
}

/**
 * Check if user can see a specific dashboard section
 * @param {Object} user - User object with roleTemplateId populated
 * @param {string} module - Module code
 * @param {string|Array} actions - Required action(s)
 * @returns {boolean} - True if user has access
 */
export function canViewSection(user, module, actions = ['view']) {
  if (!user) return false;

  // Admin always has access
  if (user.role === 'admin') return true;

  // Check module access first
  if (!hasModuleAccess(user, module)) {
    return false;
  }

  // If actions is array, check if user has any of them
  if (Array.isArray(actions)) {
    return actions.some(action => hasPermission(user, module, action));
  }

  // Single action check
  return hasPermission(user, module, actions);
}

/**
 * Get dashboard stats based on user permissions
 * @param {Object} user - User object with roleTemplateId populated
 * @param {Object} statsConfig - Stats configuration object
 * @returns {Object} - Filtered stats object
 */
export function getFilteredStats(user, statsConfig) {
  if (!user || !statsConfig) return {};

  const filteredStats = {};

  // Admin sees all stats
  if (user.role === 'admin') {
    return statsConfig;
  }

  // Filter stats based on permissions
  Object.keys(statsConfig).forEach(key => {
    const stat = statsConfig[key];
    
    // If stat has no permission requirement, include it
    if (!stat.requiredPermission && !stat.requiredModule) {
      filteredStats[key] = stat;
      return;
    }

    // Check module-level access
    if (stat.requiredModule) {
      if (hasModuleAccess(user, stat.requiredModule)) {
        filteredStats[key] = stat;
      }
      return;
    }

    // Check specific permission
    if (stat.requiredPermission) {
      const [module, action] = stat.requiredPermission.split(':');
      if (hasPermission(user, module, action)) {
        filteredStats[key] = stat;
      }
    }
  });

  return filteredStats;
}

/**
 * Get all modules user has access to for dashboard display
 * @param {Object} user - User object with roleTemplateId populated
 * @returns {Array} - Array of module codes
 */
export function getUserAccessibleModules(user) {
  return getUserModules(user);
}

/**
 * Check if user has any permission for a module (for showing module cards)
 * @param {Object} user - User object with roleTemplateId populated
 * @param {string} module - Module code
 * @returns {boolean} - True if user has any access
 */
export function hasAnyModuleAccess(user, module) {
  return hasModuleAccess(user, module);
}


