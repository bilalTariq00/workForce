'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Download, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function PayrollRunDetail({ payrollRunId }) {
  const router = useRouter();
  const [payrollRun, setPayrollRun] = useState(null);
  const [payrollCalculations, setPayrollCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPayrollRun();
  }, [payrollRunId]);

  const fetchPayrollRun = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/payroll-runs/${payrollRunId}`);
      const result = await response.json();

      if (result.success) {
        setPayrollRun(result.data);

        // If calculated, fetch detailed calculations
        if (result.data.status === 'calculated' || result.data.status === 'exported') {
          await fetchCalculations(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching payroll run:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalculations = async (payrollRunData) => {
    try {
      // Use PayrollItems if available (from new calculation system)
      if (payrollRunData.payrollItems && payrollRunData.payrollItems.length > 0) {
        setPayrollCalculations({
          calculations: payrollRunData.payrollItems,
          totals: {
            gross: payrollRunData.totalGross || 0,
            net: payrollRunData.totalNet || 0,
            tax: payrollRunData.totalTax || 0,
            deductions: payrollRunData.totalDeductions || 0,
          },
        });
        return;
      }

      // Fallback: Calculate from timesheets (legacy)
      const calculations = [];
      let totalGross = 0;
      let totalNet = 0;
      let totalTax = 0;
      let totalDeductions = 0;

      if (payrollRunData.timesheets && payrollRunData.timesheets.length > 0) {
        for (const timesheet of payrollRunData.timesheets) {
          if (!timesheet.employeeId) continue;

          const payRate = timesheet.employeeId.payRate || 0;
          const hours = timesheet.totalHours || 0;
          const gross = payRate * hours;
          const tax = gross * 0.2; // Simplified tax calculation
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
      }

      setPayrollCalculations({
        calculations,
        totals: {
          gross: Math.round(totalGross * 100) / 100,
          net: Math.round(totalNet * 100) / 100,
          tax: Math.round(totalTax * 100) / 100,
          deductions: Math.round(totalDeductions * 100) / 100,
        },
      });
    } catch (error) {
      console.error('Error fetching calculations:', error);
    }
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`/api/v1/payroll-runs/${payrollRunId}/calculate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        await fetchPayrollRun(); // Refresh data
      } else {
        alert(result.error?.message || 'Failed to calculate payroll');
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert('An error occurred while calculating payroll');
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await fetch(`/api/v1/payroll-runs/${payrollRunId}/export?format=${format}`);

      if (!response.ok) {
        const result = await response.json();
        alert(result.error?.message || 'Failed to export payroll');
        return;
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `payroll-${payrollRunId}.${format}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh to update export status
      fetchPayrollRun();
    } catch (error) {
      console.error('Error exporting payroll:', error);
      alert('An error occurred while exporting payroll');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'calculated':
        return (
          <Badge className="bg-blue-500">
            <Calculator className="h-3 w-3 mr-1" />
            Calculated
          </Badge>
        );
      case 'exported':
        return (
          <Badge className="bg-green-500">
            <Download className="h-3 w-3 mr-1" />
            Exported
          </Badge>
        );
      case 'paid':
        return <Badge className="bg-purple-500">Paid</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payrollRun) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Payroll run not found</p>
            <Link href="/hr/payroll">
              <Button className="mt-4" variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payroll Runs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/hr/payroll">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Payroll Run Details</h1>
              <p className="text-muted-foreground mt-1">
                {format(new Date(payrollRun.periodStart), 'MMM dd, yyyy')} -{' '}
                {format(new Date(payrollRun.periodEnd), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(payrollRun.status)}
          {payrollRun.status === 'draft' && (
            <Button onClick={handleCalculate} disabled={calculating}>
              {calculating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate
                </>
              )}
            </Button>
          )}
          {payrollRun.status === 'calculated' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Gross
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{payrollRun.totalGross?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              PAYE Tax
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{payrollRun.totalTax?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NI (Employee)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{payrollRun.payrollItems?.reduce((sum, item) => sum + (item.nationalInsurance?.employee?.total || 0), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              NI (Employer)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{payrollRun.payrollItems?.reduce((sum, item) => sum + (item.nationalInsurance?.employer?.total || 0), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              £{payrollRun.totalNet?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employer Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              £{payrollRun.payrollItems?.reduce((sum, item) => sum + (item.employerCost || 0), 0).toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Breakdown */}
      {payrollCalculations && payrollCalculations.calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">Employee</TableHead>
                    <TableHead>Hours (Reg/OT)</TableHead>
                    <TableHead>Pay Rate</TableHead>
                    <TableHead>Gross (Reg/OT)</TableHead>
                    <TableHead>PAYE Tax</TableHead>
                    <TableHead>NI (EE)</TableHead>
                    <TableHead>NI (ER)</TableHead>
                    <TableHead>Pension (EE)</TableHead>
                    <TableHead>Pension (ER)</TableHead>
                    <TableHead>Student Loan</TableHead>
                    <TableHead>Other Ded.</TableHead>
                    <TableHead className="font-semibold">Net Pay</TableHead>
                    <TableHead className="font-semibold text-orange-600">Employer Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollCalculations.calculations.map((item, index) => {
                    // Handle both PayrollItem format and legacy format
                    const isPayrollItem = item.grossPay !== undefined;
                    const employee = isPayrollItem ? item.employeeId : null;
                    const employeeName = isPayrollItem 
                      ? `${employee?.firstName || ''} ${employee?.lastName || ''}`.trim()
                      : item.employeeName;
                    const employeeIdNumber = isPayrollItem ? employee?.employeeId : item.employeeIdNumber;
                    
                    const hours = isPayrollItem ? item.hours : { total: item.hours, regular: item.hours, overtime: 0 };
                    const payRates = isPayrollItem ? item.payRates : { regular: item.payRate, overtime: 0 };
                    const grossPay = isPayrollItem ? item.grossPay : { total: item.gross, regular: item.gross, overtime: 0 };
                    const tax = isPayrollItem ? item.tax?.total || 0 : item.tax || 0;
                    const niEmployee = isPayrollItem ? item.nationalInsurance?.employee?.total || 0 : 0;
                    const niEmployer = isPayrollItem ? item.nationalInsurance?.employer?.total || 0 : 0;
                    const pensionEmployee = isPayrollItem ? item.pension?.employee?.amount || 0 : 0;
                    const pensionEmployer = isPayrollItem ? item.pension?.employer?.amount || 0 : 0;
                    const studentLoan = isPayrollItem ? item.studentLoan?.amount || 0 : 0;
                    const otherDeductions = isPayrollItem 
                      ? (item.otherDeductions || []).reduce((sum, d) => sum + (d.amount || 0), 0)
                      : (item.deductions || 0) - tax - niEmployee - pensionEmployee - studentLoan;
                    const net = isPayrollItem ? item.netPay || 0 : item.net || 0;
                    const employerCost = isPayrollItem ? item.employerCost || 0 : grossPay.total + niEmployer + pensionEmployer;

                    return (
                      <TableRow key={index}>
                        <TableCell className="sticky left-0 bg-background z-10">
                          <div>
                            <div className="font-medium">{employeeName}</div>
                            <div className="text-xs text-muted-foreground">
                              {employeeIdNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{hours.total?.toFixed(2) || hours.total}h</div>
                            {hours.overtime > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {hours.regular?.toFixed(2) || hours.regular}h / {hours.overtime?.toFixed(2) || hours.overtime}h OT
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            £{payRates.regular?.toFixed(2) || payRates.regular}
                            {payRates.overtime > 0 && (
                              <div className="text-xs text-muted-foreground">
                                OT: £{payRates.overtime.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            £{grossPay.total?.toFixed(2) || grossPay.total}
                            {grossPay.overtime > 0 && (
                              <div className="text-xs text-muted-foreground">
                                £{grossPay.regular?.toFixed(2) || grossPay.regular} / £{grossPay.overtime?.toFixed(2) || grossPay.overtime} OT
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>£{tax.toFixed(2)}</TableCell>
                        <TableCell>£{niEmployee.toFixed(2)}</TableCell>
                        <TableCell>£{niEmployer.toFixed(2)}</TableCell>
                        <TableCell>£{pensionEmployee.toFixed(2)}</TableCell>
                        <TableCell>£{pensionEmployer.toFixed(2)}</TableCell>
                        <TableCell>
                          {studentLoan > 0 ? `£${studentLoan.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          {otherDeductions > 0 ? `£${otherDeductions.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">£{net.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-orange-600">£{employerCost.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timesheets Included */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheets Included ({payrollRun.timesheets?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollRun.timesheets && payrollRun.timesheets.length > 0 ? (
            <div className="space-y-2">
              {payrollRun.timesheets.map((timesheet, index) => (
                <div
                  key={timesheet._id || index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {timesheet.employeeId?.firstName} {timesheet.employeeId?.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Week: {format(new Date(timesheet.weekStartDate), 'MMM dd')} -{' '}
                      {format(new Date(timesheet.weekEndDate), 'MMM dd, yyyy')} |{' '}
                      {timesheet.totalHours} hours
                    </div>
                  </div>
                  <Link href={`/hr/timesheets/${timesheet._id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No timesheets included</p>
          )}
        </CardContent>
      </Card>

      {/* Export Information */}
      {payrollRun.exportedToSage && (
        <Card>
          <CardHeader>
            <CardTitle>Export Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">Exported At:</span>{' '}
                <span className="font-medium">
                  {format(new Date(payrollRun.exportedAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {payrollRun.exportFileName && (
                <div>
                  <span className="text-sm text-muted-foreground">File Name:</span>{' '}
                  <span className="font-medium">{payrollRun.exportFileName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

