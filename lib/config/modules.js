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

// Check if user has access to a module
export function hasModuleAccess(user, moduleCode) {
  if (!user || !user.purchasedModules) return false;
  return user.purchasedModules.some(m => m.moduleCode === moduleCode && m.isAdmin);
}

// Get user's purchased module codes
export function getUserModuleCodes(user) {
  if (!user || !user.purchasedModules) return [];
  return user.purchasedModules.map(m => m.moduleCode);
}


