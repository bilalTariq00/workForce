'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Calculator, Download, Plus, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import CreatePayrollRunModal from './CreatePayrollRunModal';

export default function PayrollRunList() {
  const router = useRouter();
  const [payrollRuns, setPayrollRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPayrollRuns();
  }, [statusFilter]);

  const fetchPayrollRuns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/v1/payroll-runs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setPayrollRuns(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async (payrollRunId) => {
    try {
      const response = await fetch(`/api/v1/payroll-runs/${payrollRunId}/calculate`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        fetchPayrollRuns(); // Refresh list
      } else {
        alert(result.error?.message || 'Failed to calculate payroll');
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      alert('An error occurred while calculating payroll');
    }
  };

  const handleExport = async (payrollRunId, format = 'csv') => {
    try {
      const response = await fetch(`/api/v1/payroll-runs/${payrollRunId}/export?format=${format}`);

      if (!response.ok) {
        const result = await response.json();
        alert(result.error?.message || 'Failed to export payroll');
        return;
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `payroll-${payrollRunId}.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Refresh to update export status
      fetchPayrollRuns();
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
        return (
          <Badge className="bg-purple-500">
            Paid
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            Draft
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">Payroll Runs ({payrollRuns.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="calculated">Calculated</SelectItem>
                  <SelectItem value="exported">Exported</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto text-sm sm:text-base">
                <Plus className="h-4 w-4 mr-2" />
                Create Payroll Run
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payroll runs found</p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Payroll Run
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {payrollRuns.map((run) => (
                  <Card key={run._id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(run.periodStart), 'MMM dd, yyyy')} - {format(new Date(run.periodEnd), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {getStatusBadge(run.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Timesheets:</span>
                            <p className="font-medium">{run.timesheets?.length || 0}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Employees:</span>
                            <p className="font-medium">{run.employees?.length || 0}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Gross:</span>
                            <p className="font-medium">£{run.totalGross?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Net:</span>
                            <p className="font-medium">£{run.totalNet?.toFixed(2) || '0.00'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/hr/payroll/${run._id}`}>
                            <Button size="sm" variant="outline" className="w-full">
                              View
                            </Button>
                          </Link>
                          {run.status === 'draft' && (
                            <Button
                              size="sm"
                              onClick={() => handleCalculate(run._id)}
                              className="w-full"
                            >
                              <Calculator className="h-3 w-3 mr-1" />
                              Calculate
                            </Button>
                          )}
                          {run.status === 'calculated' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExport(run._id, 'csv')}
                              className="w-full"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export CSV
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Timesheets</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Total Gross</TableHead>
                      <TableHead>Total Net</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payrollRuns.map((run) => (
                      <TableRow key={run._id}>
                        <TableCell>
                          <div>
                            {format(new Date(run.periodStart), 'MMM dd, yyyy')}
                            <br />
                            <span className="text-xs text-muted-foreground">to</span>
                            <br />
                            {format(new Date(run.periodEnd), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>{run.timesheets?.length || 0}</TableCell>
                        <TableCell>{run.employees?.length || 0}</TableCell>
                        <TableCell>
                          £{run.totalGross?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          £{run.totalNet?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>{getStatusBadge(run.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/hr/payroll/${run._id}`}>
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </Link>
                            {run.status === 'draft' && (
                              <Button
                                size="sm"
                                onClick={() => handleCalculate(run._id)}
                              >
                                <Calculator className="h-3 w-3 mr-1" />
                                Calculate
                              </Button>
                            )}
                            {run.status === 'calculated' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleExport(run._id, 'csv')}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Export CSV
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {isCreateModalOpen && (
        <CreatePayrollRunModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchPayrollRuns();
          }}
        />
      )}
    </>
  );
}

