/**
 * Payroll Export Service
 * 
 * Purpose: Export payroll data to various formats (CSV, JSON)
 * Used in HR-05 (Payroll Run & Export)
 */

import { connectDB } from '@/lib/db/mongodb';
import { PayrollRun } from '@/lib/models/PayrollRun';
import { PayrollItem } from '@/lib/models/PayrollItem';

/**
 * Export payroll run to CSV format
 * 
 * @param {String} payrollRunId - PayrollRun ID
 * @returns {String} CSV content
 */
export async function exportPayrollToCSV(payrollRunId) {
  await connectDB();

  const payrollRun = await PayrollRun.findById(payrollRunId)
    .populate('payrollItems')
    .lean();

  if (!payrollRun) {
    throw new Error('Payroll run not found');
  }

  // Get all payroll items with populated employee data
  const payrollItems = await PayrollItem.find({
    payrollRunId: payrollRun._id,
  })
    .populate('employeeId', 'firstName lastName employeeId')
    .populate('siteIds', 'name siteCode')
    .lean();

  // CSV Headers
  const headers = [
    'Employee ID',
    'Employee Name',
    'Site(s)',
    'Total Hours',
    'Regular Hours',
    'Overtime Hours',
    'Regular Rate',
    'Overtime Rate',
    'Regular Gross',
    'Overtime Gross',
    'Total Gross',
    'PAYE Tax',
    'NI Employee',
    'NI Employer',
    'Pension Employee',
    'Pension Employer',
    'Student Loan',
    'Other Deductions',
    'Total Deductions',
    'Net Pay',
    'Employer Cost',
  ];

  // Build CSV rows
  const rows = [headers.join(',')];

  for (const item of payrollItems) {
    const employee = item.employeeId || {};
    const sites = (item.siteIds || []).map(s => s?.name || s?.siteCode || '').join('; ');
    
    const row = [
      employee.employeeId || '',
      `"${((employee.firstName || '') + ' ' + (employee.lastName || '')).trim()}"`,
      `"${sites}"`,
      item.hours?.total || 0,
      item.hours?.regular || 0,
      item.hours?.overtime || 0,
      item.payRates?.regular || 0,
      item.payRates?.overtime || 0,
      item.grossPay?.regular || 0,
      item.grossPay?.overtime || 0,
      item.grossPay?.total || 0,
      item.tax?.total || 0,
      item.nationalInsurance?.employee?.total || 0,
      item.nationalInsurance?.employer?.total || 0,
      item.pension?.employee?.amount || 0,
      item.pension?.employer?.amount || 0,
      item.studentLoan?.amount || 0,
      (item.otherDeductions || []).reduce((sum, d) => sum + (d.amount || 0), 0),
      item.totalDeductions || 0,
      item.netPay || 0,
      item.employerCost || 0,
    ].map(val => {
      // Format numbers to 2 decimal places
      if (typeof val === 'number') {
        return val.toFixed(2);
      }
      return val;
    });

    rows.push(row.join(','));
  }

  // Add totals row
  const totals = [
    'TOTALS',
    '',
    '',
    payrollItems.reduce((sum, item) => sum + (item.hours?.total || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.hours?.regular || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.hours?.overtime || 0), 0).toFixed(2),
    '',
    '',
    payrollItems.reduce((sum, item) => sum + (item.grossPay?.regular || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.grossPay?.overtime || 0), 0).toFixed(2),
    payrollRun.totalGross?.toFixed(2) || '0.00',
    payrollRun.totalTax?.toFixed(2) || '0.00',
    payrollItems.reduce((sum, item) => sum + (item.nationalInsurance?.employee?.total || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.nationalInsurance?.employer?.total || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.pension?.employee?.amount || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.pension?.employer?.amount || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + (item.studentLoan?.amount || 0), 0).toFixed(2),
    payrollItems.reduce((sum, item) => sum + ((item.otherDeductions || []).reduce((s, d) => s + (d.amount || 0), 0)), 0).toFixed(2),
    payrollRun.totalDeductions?.toFixed(2) || '0.00',
    payrollRun.totalNet?.toFixed(2) || '0.00',
    payrollItems.reduce((sum, item) => sum + (item.employerCost || 0), 0).toFixed(2),
  ];
  rows.push(totals.join(','));

  return rows.join('\n');
}

/**
 * Export payroll run to JSON format
 * 
 * @param {String} payrollRunId - PayrollRun ID
 * @returns {Object} JSON object
 */
export async function exportPayrollToJSON(payrollRunId) {
  await connectDB();

  const payrollRun = await PayrollRun.findById(payrollRunId)
    .populate('createdBy', 'firstName lastName email')
    .populate('employees', 'firstName lastName employeeId')
    .lean();

  if (!payrollRun) {
    throw new Error('Payroll run not found');
  }

  // Get all payroll items with populated data
  const payrollItems = await PayrollItem.find({
    payrollRunId: payrollRun._id,
  })
    .populate('employeeId', 'firstName lastName employeeId')
    .populate('siteIds', 'name siteCode')
    .populate('timesheetIds', 'weekStartDate weekEndDate totalHours')
    .lean();

  return {
    payrollRun: {
      id: payrollRun._id,
      periodStart: payrollRun.periodStart,
      periodEnd: payrollRun.periodEnd,
      status: payrollRun.status,
      totals: {
        gross: payrollRun.totalGross,
        tax: payrollRun.totalTax,
        deductions: payrollRun.totalDeductions,
        net: payrollRun.totalNet,
      },
      createdBy: payrollRun.createdBy,
      createdAt: payrollRun.createdAt,
    },
    payrollItems: payrollItems.map(item => ({
      employee: {
        id: item.employeeId?._id,
        employeeId: item.employeeId?.employeeId,
        name: `${item.employeeId?.firstName || ''} ${item.employeeId?.lastName || ''}`.trim(),
      },
      sites: (item.siteIds || []).map(site => ({
        id: site._id,
        name: site.name,
        code: site.siteCode,
      })),
      hours: item.hours,
      payRates: item.payRates,
      grossPay: item.grossPay,
      tax: item.tax,
      nationalInsurance: item.nationalInsurance,
      pension: item.pension,
      studentLoan: item.studentLoan,
      otherDeductions: item.otherDeductions,
      totalDeductions: item.totalDeductions,
      netPay: item.netPay,
      employerCost: item.employerCost,
    })),
  };
}

