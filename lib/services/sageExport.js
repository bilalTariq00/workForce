/**
 * Sage Payroll Export Service
 * 
 * Purpose: Export payroll data to Sage format
 * Used in HR-05 (Payroll Run & Export)
 * 
 * Formats:
 * - CSV format (for Sage import)
 * - JSON format (for API integration)
 */

/**
 * Transform payroll data to Sage CSV format
 * 
 * Sage CSV format typically includes:
 * - Employee ID
 * - Employee Name
 * - Pay Period
 * - Hours
 * - Gross Pay
 * - Tax
 * - Deductions
 * - Net Pay
 * 
 * @param {Object} payrollData - Payroll calculation results
 * @param {Object} payrollRun - PayrollRun document
 * @returns {String} CSV string
 */
export function exportToSageCSV(payrollData, payrollRun) {
  const headers = [
    'Employee ID',
    'Employee Name',
    'Period Start',
    'Period End',
    'Hours',
    'Pay Rate',
    'Gross Pay',
    'Tax',
    'Deductions',
    'Net Pay',
  ];

  const rows = payrollData.calculations.map((calc) => [
    calc.employeeIdNumber,
    calc.employeeName,
    formatDateForSage(payrollRun.periodStart),
    formatDateForSage(payrollRun.periodEnd),
    calc.hours,
    calc.payRate,
    calc.gross.toFixed(2),
    calc.tax.toFixed(2),
    calc.deductions.toFixed(2),
    calc.net.toFixed(2),
  ]);

  // Combine headers and rows
  const csvRows = [headers, ...rows];

  // Convert to CSV string
  return csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Transform payroll data to Sage JSON format
 * 
 * @param {Object} payrollData - Payroll calculation results
 * @param {Object} payrollRun - PayrollRun document
 * @returns {Object} JSON object
 */
export function exportToSageJSON(payrollData, payrollRun) {
  return {
    payrollRunId: payrollRun._id.toString(),
    periodStart: payrollRun.periodStart.toISOString(),
    periodEnd: payrollRun.periodEnd.toISOString(),
    exportDate: new Date().toISOString(),
    employees: payrollData.calculations.map((calc) => ({
      employeeId: calc.employeeIdNumber,
      employeeName: calc.employeeName,
      hours: calc.hours,
      payRate: calc.payRate,
      gross: calc.gross,
      tax: calc.tax,
      deductions: calc.deductions,
      net: calc.net,
    })),
    totals: payrollData.totals,
  };
}

/**
 * Format date for Sage (DD/MM/YYYY)
 * 
 * @param {Date} date - Date to format
 * @returns {String} Formatted date string
 */
function formatDateForSage(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Generate payslip data for an employee
 * 
 * @param {Object} calculation - Payroll calculation for employee
 * @param {Object} payrollRun - PayrollRun document
 * @param {Object} employee - Employee document
 * @returns {Object} Payslip data
 */
export function generatePayslipData(calculation, payrollRun, employee) {
  return {
    employeeId: employee.employeeId,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    periodStart: payrollRun.periodStart,
    periodEnd: payrollRun.periodEnd,
    payDate: payrollRun.periodEnd,
    hours: calculation.hours,
    payRate: calculation.payRate,
    gross: calculation.gross,
    tax: calculation.tax,
    deductions: calculation.deductions,
    net: calculation.net,
    breakdown: {
      gross: calculation.gross,
      tax: calculation.tax,
      deductions: calculation.deductions,
      net: calculation.net,
    },
  };
}

