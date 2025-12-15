export const MODULES = {
  HRM: {
    code: 'hrm',
    name: 'Human Resource Management',
    description: 'Manage employees, payroll, timesheets, leave requests, and certifications',
    route: '/hr',
    icon: 'Users',
    features: ['employees', 'payroll', 'timesheets', 'leave-requests', 'certifications', 'sites'],
  },
  REGISTERS: {
    code: 'registers',
    name: 'Registers',
    description: 'Attendance tracking, certifications, and employee registers',
    route: '/registers',
    icon: 'ClipboardList',
    features: ['attendance', 'certifications', 'employee-register'],
  },
  PROCESS_MANAGEMENT: {
    code: 'process_management',
    name: 'Process Management',
    description: 'Daily logs, attendance verification, and site process management',
    route: '/site-manager',
    icon: 'FileText',
    features: ['daily-logs', 'attendance-verification', 'variations'],
  },
  FINANCE_PAYROLL: {
    code: 'finance_payroll',
    name: 'Finance & Payrolls',
    description: 'Payroll processing, timesheet management, and financial reporting',
    route: '/hr/payroll',
    icon: 'DollarSign',
    features: ['payroll', 'timesheets', 'financial-reports'],
  },
  EQUIPMENT: {
    code: 'equipment',
    name: 'Equipment Management',
    description: 'Track tools, equipment assignments, and maintenance',
    route: '/hr/tools',
    icon: 'Wrench',
    features: ['tools', 'tool-assignments', 'equipment-tracking'],
  },
  PROCUREMENT: {
    code: 'procurement',
    name: 'Procurement',
    description: 'Purchase orders, vendor management, and procurement workflows',
    route: '/procurement',
    icon: 'ShoppingCart',
    features: ['purchase-orders', 'vendors', 'procurement-workflows'],
  },
};

// Module prices (in your currency)
export const MODULE_PRICES = {
  hrm: 99,
  registers: 49,
  process_management: 79,
  finance_payroll: 129,
  equipment: 59,
  procurement: 89,
};

// Buy All discount (percentage)
export const BUY_ALL_DISCOUNT = 20; // 20% discount

// Calculate "Buy All" price
export function getBuyAllPrice() {
  const total = Object.values(MODULE_PRICES).reduce((sum, price) => sum + price, 0);
  return Math.round(total * (1 - BUY_ALL_DISCOUNT / 100));
}

// Get module by code
export function getModuleByCode(code) {
  return Object.values(MODULES).find(m => m.code === code);
}

// Get all module codes
export function getAllModuleCodes() {
  return Object.values(MODULES).map(m => m.code);
}

/**
 * Default module access based on role (when no role template is assigned)
 * Maps roles to their default accessible modules
 * These match the default role templates in scripts/seed-role-templates.js
 */
const ROLE_DEFAULT_MODULES = {
  labour: ['attendance', 'leave_requests', 'certifications'],
  site_manager: ['process_management', 'attendance', 'timesheets', 'sites'],
  contracts_manager: ['sites', 'process_management', 'attendance', 'reports'],
  hr_officer: ['hrm', 'attendance', 'certifications', 'timesheets', 'finance_payroll', 'leave_requests', 'reports'],
  ehs_officer: ['certifications', 'reports'],
  admin: ['hrm', 'registers', 'process_management', 'finance_payroll', 'equipment', 'procurement', 'attendance', 'certifications', 'timesheets', 'leave_requests', 'sites', 'reports'], // Admin gets all
};

import { hasModulePermission } from '@/lib/utils/permissions';

/**
 * Check if user has access to a module
 * Priority: 1. Role Template permissions, 2. Role-based defaults, 3. Purchased modules
 * 
 * IMPORTANT: All employees created by HR have a role, so they automatically get
 * role-based access. They don't need to purchase modules.
 * 
 * This function now uses the permission utilities for consistency
 */
export function hasModuleAccess(user, moduleCode) {
  if (!user) return false;
  
  // Use permission utility (which checks role template first)
  if (hasModulePermission(user, moduleCode)) {
    return true;
  }
  
  // Fallback: Check role-based default access (for backward compatibility)
  if (user.role) {
    const roleModules = ROLE_DEFAULT_MODULES[user.role] || [];
    if (roleModules.includes(moduleCode)) return true;
  }
  
  // Fallback: Check purchased modules (for backward compatibility)
  if (user.purchasedModules && user.purchasedModules.length > 0) {
    return user.purchasedModules.some(m => m.moduleCode === moduleCode && m.isAdmin);
  }
  
  return false;
}

/**
 * Get user's module codes from role template, role defaults, or purchased modules
 */
export function getUserModuleCodes(user) {
  if (!user) return [];
  
  const moduleCodes = new Set();
  
  // Get modules from role template permissions (highest priority)
  if (user.roleTemplateId && user.roleTemplateId.permissions) {
    user.roleTemplateId.permissions.forEach(p => {
      if (p.module && p.actions && p.actions.length > 0) {
        moduleCodes.add(p.module);
      }
    });
  }
  
  // If no role template, use role-based defaults
  if (!user.roleTemplateId && user.role) {
    const roleModules = ROLE_DEFAULT_MODULES[user.role] || [];
    roleModules.forEach(module => moduleCodes.add(module));
  }
  
  // Also include purchased modules (for backward compatibility)
  if (user.purchasedModules && user.purchasedModules.length > 0) {
    user.purchasedModules.forEach(m => {
      if (m.moduleCode) moduleCodes.add(m.moduleCode);
    });
  }
  
  return Array.from(moduleCodes);
}


