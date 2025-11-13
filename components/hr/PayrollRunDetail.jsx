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
      // Calculate from the timesheets in the payroll run
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Total Tax
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
              Total Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              £{payrollRun.totalDeductions?.toFixed(2) || '0.00'}
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
                    <TableHead>Employee</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Pay Rate</TableHead>
                    <TableHead>Gross</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollCalculations.calculations.map((calc, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{calc.employeeName}</div>
                          <div className="text-xs text-muted-foreground">
                            {calc.employeeIdNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{calc.hours}</TableCell>
                      <TableCell>£{calc.payRate.toFixed(2)}</TableCell>
                      <TableCell>£{calc.gross.toFixed(2)}</TableCell>
                      <TableCell>£{calc.tax.toFixed(2)}</TableCell>
                      <TableCell>£{calc.deductions.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold">£{calc.net.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
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

