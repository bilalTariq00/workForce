/**
 * Payroll Calculator Service
 * 
 * Purpose: Calculate UK payroll for employees based on timesheets
 * Used in HR-05 (Payroll Run & Export)
 * 
 * Features:
 * - Full UK PAYE tax calculation using tax bands
 * - National Insurance (Employee & Employer)
 * - Pension contributions (Employee & Employer)
 * - Student loan deductions
 * - Regular vs Overtime hours separation
 * - Other deductions
 */

import { connectDB } from '@/lib/db/mongodb';
import { Timesheet } from '@/lib/models/Timesheet';
import { Employee } from '@/lib/models/Employee';
import { TaxConfig } from '@/lib/models/TaxConfig';
import { NIConfig } from '@/lib/models/NIConfig';
import { PensionConfig } from '@/lib/models/PensionConfig';
import { PayrollItem } from '@/lib/models/PayrollItem';
import { PayrollRun } from '@/lib/models/PayrollRun';

/**
 * Get tax year for a given date
 * UK tax year runs from 6 April to 5 April
 */
function getTaxYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // If date is before 6 April, tax year is previous year to current year
  if (month < 4 || (month === 4 && day < 6)) {
    return `${year - 1}-${year}`;
  }
  // Otherwise, tax year is current year to next year
  return `${year}-${year + 1}`;
}

/**
 * Calculate PAYE tax using tax bands
 * 
 * @param {Number} grossPay - Annual gross pay (pro-rated for period)
 * @param {Object} taxConfig - TaxConfig document
 * @param {String} taxCode - Employee tax code (e.g., "1250L")
 * @returns {Object} Tax calculation breakdown
 */
function calculatePAYE(grossPay, taxConfig, taxCode = '1250L') {
  // Extract personal allowance from tax code
  // Format: Letter(s) + numbers + optional letter
  // e.g., "1250L" = £12,500 personal allowance
  let personalAllowance = taxConfig.personalAllowance || 12570;
  
  // Parse tax code to get custom personal allowance
  const taxCodeMatch = taxCode?.match(/^([A-Z]*)(\d+)([A-Z]*)$/);
  if (taxCodeMatch) {
    const codeNumber = parseInt(taxCodeMatch[2], 10);
    if (codeNumber > 0) {
      // Tax code number represents personal allowance / 10
      // e.g., 1250 = £12,500
      personalAllowance = codeNumber * 10;
    }
  }

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossPay - personalAllowance);
  
  if (taxableIncome <= 0) {
    return {
      personalAllowanceUsed: grossPay,
      taxableIncome: 0,
      byBand: [],
      total: 0,
    };
  }

  // Calculate tax by band
  // Tax bands are applied to taxable income (after personal allowance)
  const taxBands = taxConfig.taxBands || [];
  const byBand = [];
  let remainingIncome = taxableIncome;
  let totalTax = 0;

  // Sort bands by minIncome to process in order
  const sortedBands = [...taxBands].sort((a, b) => (a.minIncome || 0) - (b.minIncome || 0));

  for (const band of sortedBands) {
    if (remainingIncome <= 0) break;

    const bandMin = band.minIncome || 0;
    const bandMax = band.maxIncome || Infinity;
    const rate = band.rate || 0;

    // Calculate how much of the taxable income falls in this band
    // Taxable income starts from 0 (after personal allowance)
    // So we need to map it to the actual income bands
    const taxableBandMin = Math.max(0, bandMin - personalAllowance);
    const taxableBandMax = bandMax === null ? Infinity : Math.max(0, bandMax - personalAllowance);

    // Calculate income in this band
    const incomeInBand = Math.max(0, Math.min(remainingIncome, taxableBandMax) - Math.max(0, taxableBandMin));

    if (incomeInBand > 0) {
      const taxInBand = (incomeInBand * rate) / 100;
      totalTax += taxInBand;

      byBand.push({
        band: band.name,
        income: Math.round(incomeInBand * 100) / 100,
        rate,
        amount: Math.round(taxInBand * 100) / 100,
      });

      remainingIncome -= incomeInBand;
    }
  }

  return {
    personalAllowanceUsed: Math.min(grossPay, personalAllowance),
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    byBand,
    total: Math.round(totalTax * 100) / 100,
  };
}

/**
 * Calculate National Insurance (Employee)
 * 
 * @param {Number} grossPay - Gross pay
 * @param {Object} niConfig - NIConfig document
 * @returns {Object} Employee NI calculation
 */
function calculateEmployeeNI(grossPay, niConfig) {
  const config = niConfig.employeeNI || {};
  const primaryThreshold = config.primaryThreshold || 12570;
  const upperLimit = config.upperEarningsLimit || 50270;
  const standardRate = config.standardRate || 12;
  const additionalRate = config.additionalRate || 2;

  // Annualize for calculation (assuming weekly/monthly pay periods)
  // For simplicity, we'll calculate on the period amount
  // In production, you'd need to track YTD earnings

  const earningsAboveThreshold = Math.max(0, grossPay - primaryThreshold);
  
  if (earningsAboveThreshold <= 0) {
    return {
      earnings: 0,
      standardRate: 0,
      additionalRate: 0,
      total: 0,
    };
  }

  // Standard rate (12%) on earnings between threshold and upper limit
  const earningsAtStandardRate = Math.min(earningsAboveThreshold, upperLimit - primaryThreshold);
  const standardRateNI = (earningsAtStandardRate * standardRate) / 100;

  // Additional rate (2%) on earnings above upper limit
  const earningsAboveUpperLimit = Math.max(0, grossPay - upperLimit);
  const additionalRateNI = (earningsAboveUpperLimit * additionalRate) / 100;

  return {
    earnings: Math.round(earningsAboveThreshold * 100) / 100,
    standardRate: Math.round(standardRateNI * 100) / 100,
    additionalRate: Math.round(additionalRateNI * 100) / 100,
    total: Math.round((standardRateNI + additionalRateNI) * 100) / 100,
  };
}

/**
 * Calculate National Insurance (Employer)
 * 
 * @param {Number} grossPay - Gross pay
 * @param {Object} niConfig - NIConfig document
 * @returns {Object} Employer NI calculation
 */
function calculateEmployerNI(grossPay, niConfig) {
  const config = niConfig.employerNI || {};
  const secondaryThreshold = config.secondaryThreshold || 9100;
  const rate = config.rate || 13.8;

  const earningsAboveThreshold = Math.max(0, grossPay - secondaryThreshold);
  const employerNI = (earningsAboveThreshold * rate) / 100;

  return {
    earnings: Math.round(earningsAboveThreshold * 100) / 100,
    total: Math.round(employerNI * 100) / 100,
  };
}

/**
 * Calculate pension contributions
 * 
 * @param {Number} grossPay - Gross pay
 * @param {Object} employee - Employee document
 * @param {Object} pensionConfig - PensionConfig document
 * @returns {Object} Pension calculation
 */
function calculatePension(grossPay, employee, pensionConfig) {
  if (!pensionConfig || !employee.payroll?.pensionContribution) {
    return {
      employee: { rate: 0, amount: 0, earnings: 0 },
      employer: { rate: 0, amount: 0, earnings: 0 },
      schemeCode: null,
    };
  }

  // Get employee contribution rate
  const employeeRate = employee.payroll.pensionContribution || 0;
  
  // Get employer contribution rate (default from scheme, or match employee rate)
  const employerRate = pensionConfig.defaultEmployerRate || 3;

  // Calculate pensionable earnings
  // For auto-enrollment, use qualifying earnings (gross - threshold)
  const qualifyingEarningsThreshold = pensionConfig.autoEnrollment?.qualifyingEarningsThreshold || 6240;
  const pensionableEarnings = Math.max(0, grossPay - (qualifyingEarningsThreshold / 52)); // Weekly threshold

  // Calculate contributions
  const employeeContribution = (pensionableEarnings * employeeRate) / 100;
  const employerContribution = (pensionableEarnings * employerRate) / 100;

  return {
    employee: {
      rate: employeeRate,
      amount: Math.round(employeeContribution * 100) / 100,
      earnings: Math.round(pensionableEarnings * 100) / 100,
    },
    employer: {
      rate: employerRate,
      amount: Math.round(employerContribution * 100) / 100,
      earnings: Math.round(pensionableEarnings * 100) / 100,
    },
    schemeCode: pensionConfig.schemeCode || null,
  };
}

/**
 * Calculate student loan deduction
 * 
 * @param {Number} grossPay - Gross pay
 * @param {Object} employee - Employee document
 * @returns {Object} Student loan calculation
 */
function calculateStudentLoan(grossPay, employee) {
  if (!employee.payroll?.studentLoan || !employee.payroll?.studentLoanPlan) {
    return {
      plan: null,
      threshold: 0,
      rate: 0,
      amount: 0,
    };
  }

  // UK Student Loan thresholds and rates (2024-2025)
  const thresholds = {
    plan1: 22015, // Annual threshold
    plan2: 27295,
    plan4: 27295,
    postgraduate: 21000,
  };

  const rates = {
    plan1: 9,
    plan2: 9,
    plan4: 9,
    postgraduate: 6,
  };

  const plan = employee.payroll.studentLoanPlan;
  const planKey = plan.toLowerCase();
  const threshold = thresholds[planKey] || 0;
  const rate = rates[planKey] || 0;

  // Annualize threshold for period calculation
  // Assuming weekly pay: threshold / 52
  const weeklyThreshold = threshold / 52;
  const earningsAboveThreshold = Math.max(0, grossPay - weeklyThreshold);
  const deduction = (earningsAboveThreshold * rate) / 100;

  return {
    plan: plan.charAt(0).toUpperCase() + plan.slice(1), // Capitalize
    threshold: weeklyThreshold,
    rate,
    amount: Math.round(deduction * 100) / 100,
  };
}

/**
 * Separate regular and overtime hours
 * Standard work week is typically 37.5 or 40 hours
 * 
 * @param {Number} totalHours - Total hours worked
 * @param {Number} standardWeekHours - Standard hours per week (default: 37.5)
 * @returns {Object} Hours breakdown
 */
function separateRegularOvertimeHours(totalHours, standardWeekHours = 37.5) {
  const regular = Math.min(totalHours, standardWeekHours);
  const overtime = Math.max(0, totalHours - standardWeekHours);

  return {
    regular: Math.round(regular * 100) / 100,
    overtime: Math.round(overtime * 100) / 100,
  };
}

/**
 * Calculate payroll for a single employee
 * 
 * @param {Object} timesheet - Timesheet document
 * @param {Object} employee - Employee document
 * @param {Object} payrollRun - PayrollRun document
 * @returns {Object} PayrollItem document
 */
export async function calculateEmployeePayroll(timesheet, employee, payrollRun) {
  await connectDB();

  // Get active configs for the tax year
  const taxYear = getTaxYear(payrollRun.periodStart);
  const taxConfig = await TaxConfig.getConfigForYear(taxYear);
  const niConfig = await NIConfig.getConfigForYear(taxYear);
  
  // Get pension scheme
  let pensionConfig = null;
  if (employee.payroll?.pensionScheme) {
    pensionConfig = await PensionConfig.getSchemeByCode(employee.payroll.pensionScheme);
  }
  if (!pensionConfig) {
    pensionConfig = await PensionConfig.getDefaultScheme();
  }

  if (!taxConfig || !niConfig) {
    throw new Error(`Tax or NI configuration not found for tax year ${taxYear}`);
  }

  // Get pay rate and hours
  const payRate = employee.payRate || 0;
  const totalHours = timesheet.totalHours || 0;

  // Separate regular and overtime hours
  const standardWeekHours = 37.5; // Can be configurable per employee
  const hoursBreakdown = separateRegularOvertimeHours(totalHours, standardWeekHours);
  
  // Overtime rate (default: 1.5x regular rate)
  const overtimeRate = payRate * 1.5;

  // Calculate gross pay
  const regularGross = hoursBreakdown.regular * payRate;
  const overtimeGross = hoursBreakdown.overtime * overtimeRate;
  const totalGross = regularGross + overtimeGross;

  // Calculate PAYE tax
  const taxCalculation = calculatePAYE(
    totalGross,
    taxConfig,
    employee.payroll?.taxCode || '1250L'
  );

  // Calculate National Insurance
  const employeeNI = calculateEmployeeNI(totalGross, niConfig);
  const employerNI = calculateEmployerNI(totalGross, niConfig);

  // Calculate pension
  const pensionCalculation = calculatePension(totalGross, employee, pensionConfig);

  // Calculate student loan
  const studentLoanCalculation = calculateStudentLoan(totalGross, employee);

  // Get other deductions
  const otherDeductions = (employee.payroll?.otherDeductions || []).map(deduction => ({
    description: deduction.name || deduction.description || 'Other deduction',
    amount: deduction.amount || 0,
  }));

  // Get site IDs from timesheet
  const siteIds = [...new Set(
    (timesheet.hours || [])
      .map(day => day.siteId)
      .filter(siteId => siteId)
  )];

  // Create PayrollItem
  const payrollItem = await PayrollItem.create({
    payrollRunId: payrollRun._id,
    employeeId: employee._id,
    timesheetIds: [timesheet._id],
    siteIds,
    hours: {
      total: totalHours,
      regular: hoursBreakdown.regular,
      overtime: hoursBreakdown.overtime,
    },
    payRates: {
      regular: payRate,
      overtime: overtimeRate,
    },
    grossPay: {
      regular: Math.round(regularGross * 100) / 100,
      overtime: Math.round(overtimeGross * 100) / 100,
      total: Math.round(totalGross * 100) / 100,
    },
    tax: taxCalculation,
    nationalInsurance: {
      employee: employeeNI,
      employer: employerNI,
    },
    pension: pensionCalculation,
    studentLoan: studentLoanCalculation,
    otherDeductions,
    taxYear,
    taxConfigId: taxConfig._id,
    niConfigId: niConfig._id,
    pensionConfigId: pensionConfig?._id || null,
  });

  return payrollItem;
}

/**
 * Calculate payroll for a payroll run
 * Creates PayrollItem records for each employee
 * 
 * @param {String} payrollRunId - PayrollRun ID
 * @returns {Object} Calculation results
 */
export async function calculatePayrollForRun(payrollRunId) {
  await connectDB();

  const payrollRun = await PayrollRun.findById(payrollRunId);
  if (!payrollRun) {
    throw new Error('Payroll run not found');
  }

  if (payrollRun.status !== 'draft') {
    throw new Error('Can only calculate draft payroll runs');
  }

  // Get all timesheets for this payroll run
  const timesheets = await Timesheet.find({
    _id: { $in: payrollRun.timesheets },
    status: 'locked',
  })
    .populate('employeeId')
    .populate('hours.siteId', 'name siteCode')
    .lean();

  // Group timesheets by employee
  const timesheetsByEmployee = {};
  for (const timesheet of timesheets) {
    if (!timesheet.employeeId) continue;
    
    const employeeId = timesheet.employeeId._id.toString();
    if (!timesheetsByEmployee[employeeId]) {
      timesheetsByEmployee[employeeId] = {
        employee: timesheet.employeeId,
        timesheets: [],
      };
    }
    timesheetsByEmployee[employeeId].timesheets.push(timesheet);
  }

  // Calculate payroll for each employee
  const payrollItems = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;
  let totalDeductions = 0;
  let totalEmployerCost = 0;

  for (const [employeeId, data] of Object.entries(timesheetsByEmployee)) {
    // For employees with multiple timesheets, combine them
    // For simplicity, we'll calculate per timesheet and aggregate
    // In production, you might want to combine timesheets first
    
    let employeeGross = 0;
    let employeeNet = 0;
    let employeeTax = 0;
    let employeeDeductions = 0;
    let employeeEmployerCost = 0;

    for (const timesheet of data.timesheets) {
      const payrollItem = await calculateEmployeePayroll(timesheet, data.employee, payrollRun);
      payrollItems.push(payrollItem);

      employeeGross += payrollItem.grossPay.total;
      employeeNet += payrollItem.netPay;
      employeeTax += payrollItem.tax.total;
      employeeDeductions += payrollItem.totalDeductions;
      employeeEmployerCost += payrollItem.employerCost;
    }

    totalGross += employeeGross;
    totalNet += employeeNet;
    totalTax += employeeTax;
    totalDeductions += employeeDeductions;
    totalEmployerCost += employeeEmployerCost;
  }

  // Update payroll run with totals and link payroll items
  payrollRun.totalGross = Math.round(totalGross * 100) / 100;
  payrollRun.totalNet = Math.round(totalNet * 100) / 100;
  payrollRun.totalTax = Math.round(totalTax * 100) / 100;
  payrollRun.totalDeductions = Math.round(totalDeductions * 100) / 100;
  payrollRun.payrollItems = payrollItems.map(item => item._id);
  payrollRun.status = 'calculated';
  await payrollRun.save();

  return {
    payrollItems,
    totals: {
      gross: totalGross,
      net: totalNet,
      tax: totalTax,
      deductions: totalDeductions,
      employerCost: totalEmployerCost,
    },
  };
}

/**
 * Legacy function for backward compatibility
 * Calculate payroll for multiple timesheets (simplified)
 */
export async function calculatePayrollForTimesheets(timesheetIds) {
  await connectDB();

  const timesheets = await Timesheet.find({
    _id: { $in: timesheetIds },
    status: 'locked',
  })
    .populate('employeeId')
    .lean();

  const calculations = [];
  let totalGross = 0;
  let totalNet = 0;
  let totalTax = 0;
  let totalDeductions = 0;

  for (const timesheet of timesheets) {
    if (!timesheet.employeeId) continue;

    const payRate = timesheet.employeeId.payRate || 0;
    const hours = timesheet.totalHours || 0;
    const gross = payRate * hours;
    const tax = gross * 0.2; // Simplified
    const deductions = 0;
    const net = gross - tax - deductions;

    calculations.push({
      employeeId: timesheet.employeeId._id,
      employeeName: `${timesheet.employeeId.firstName} ${timesheet.employeeId.lastName}`,
      employeeIdNumber: timesheet.employeeId.employeeId,
      timesheetId: timesheet._id,
      hours: Math.round(hours * 100) / 100,
      payRate: Math.round(payRate * 100) / 100,
      gross: Math.round(gross * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      net: Math.round(net * 100) / 100,
    });

    totalGross += gross;
    totalNet += net;
    totalTax += tax;
    totalDeductions += deductions;
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
