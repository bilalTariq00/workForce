/**
 * Payroll Calculator Service
 * 
 * Purpose: Calculate payroll for employees based on timesheets
 * Used in HR-05 (Payroll Run & Export)
 * 
 * Features:
 * - Calculate gross pay (hours × rate)
 * - Calculate tax (simplified tax calculation)
 * - Calculate deductions
 * - Calculate net pay
 */

import { Timesheet } from '@/lib/models/Timesheet';
import { Employee } from '@/lib/models/Employee';

/**
 * Calculate payroll for a single employee's timesheet
 * 
 * @param {Object} timesheet - Timesheet document
 * @param {Object} employee - Employee document
 * @returns {Object} Payroll calculation result
 */
export async function calculateEmployeePayroll(timesheet, employee) {
  const payRate = employee.payRate || 0;
  const hours = timesheet.totalHours || 0;

  // Calculate gross pay
  const gross = payRate * hours;

  // Calculate tax (simplified - 20% for now)
  // In production, this would use proper tax brackets
  const tax = gross * 0.2;

  // Calculate deductions (simplified - can be extended)
  // In production, this would include:
  // - National Insurance
  // - Pension contributions
  // - Other deductions
  const deductions = 0;

  // Calculate net pay
  const net = gross - tax - deductions;

  return {
    employeeId: employee._id,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeIdNumber: employee.employeeId,
    timesheetId: timesheet._id,
    hours: Math.round(hours * 100) / 100,
    payRate: Math.round(payRate * 100) / 100,
    gross: Math.round(gross * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    net: Math.round(net * 100) / 100,
  };
}

/**
 * Calculate payroll for multiple timesheets
 * 
 * @param {Array} timesheetIds - Array of timesheet IDs
 * @returns {Object} Payroll calculation results
 */
export async function calculatePayrollForTimesheets(timesheetIds) {
  const timesheets = await Timesheet.find({
    _id: { $in: timesheetIds },
    status: 'locked', // Only include locked timesheets
  })
    .populate('employeeId')
    .lean();

  const calculations = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;
  let totalDeductions = 0;

  for (const timesheet of timesheets) {
    if (!timesheet.employeeId) {
      continue;
    }

    const calculation = await calculateEmployeePayroll(timesheet, timesheet.employeeId);
    calculations.push(calculation);

    totalGross += calculation.gross;
    totalNet += calculation.net;
    totalTax += calculation.tax;
    totalDeductions += calculation.deductions;
  }

  return {
    calculations,
    totals: {
      gross: Math.round(totalGross * 100) / 100,
      net: Math.round(totalNet * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      deductions: Math.round(totalDeductions * 100) / 100,
    },
  };
}

