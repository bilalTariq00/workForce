'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Loader,
  Calendar,
  User,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Timesheet Detail Client Component
 * 
 * Displays timesheet details and allows approval/locking
 */
export default function TimesheetDetailClient({ timesheetId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timesheet, setTimesheet] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  // Fetch timesheet
  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        setError('');
        const response = await fetch(`/api/v1/timesheets/${timesheetId}`);
        const result = await response.json();

        if (result.success) {
          setTimesheet(result.data);
        } else {
          setError(result.error?.message || 'Failed to load timesheet');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Error fetching timesheet:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheet();
  }, [timesheetId]);

  // Handle approve
  const handleApprove = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/v1/timesheets/${timesheetId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: approvalNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Timesheet approved successfully');
        setTimesheet(result.data);
        setApprovalNotes('');
        router.refresh();
      } else {
        setError(result.error?.message || 'Failed to approve timesheet');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle lock
  const handleLock = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/v1/timesheets/${timesheetId}/lock`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Timesheet locked for payroll');
        setTimesheet(result.data);
        router.refresh();
      } else {
        setError(result.error?.message || 'Failed to lock timesheet');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !timesheet) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Link href="/hr/timesheets">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timesheets
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timesheet) {
    return null;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatWeek = (weekStartDate) => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      locked: 'bg-purple-100 text-purple-800',
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/hr/timesheets">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Timesheets
        </Button>
      </Link>

      {/* Success/Error Messages */}
      {success && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-800">{success}</p>
          </CardContent>
        </Card>
      )}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Timesheet Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timesheet Details
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{formatWeek(timesheet.weekStartDate)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(timesheet.status)}`}>
              {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Employee</p>
                <p className="font-semibold">
                  {timesheet.employeeId?.firstName} {timesheet.employeeId?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{timesheet.employeeId?.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{timesheet.totalHours}h</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Attendance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timesheet.hours?.map((day, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(day.date)}</TableCell>
                  <TableCell className="font-semibold">{day.hours}h</TableCell>
                  <TableCell>
                    {day.siteId?.name || '-'}
                  </TableCell>
                  <TableCell>
                    {day.attendanceId ? (
                      <span className="text-xs text-green-600">Recorded</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No attendance</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Actions */}
      {timesheet.status !== 'locked' && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {timesheet.status !== 'approved' && (
              <div>
                <label className="block text-sm font-medium mb-2">Approval Notes (Optional)</label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading || timesheet.status === 'approved'}
                  className="mt-4"
                >
                  {actionLoading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve Timesheet
                </Button>
              </div>
            )}

            {timesheet.status === 'approved' && (
              <Button onClick={handleLock} disabled={actionLoading} variant="default">
                {actionLoading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Lock for Payroll
              </Button>
            )}

            {timesheet.approvedBy && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Approved by: {timesheet.approvedBy.firstName} {timesheet.approvedBy.lastName}
                  {timesheet.approvedAt &&
                    ` on ${new Date(timesheet.approvedAt).toLocaleDateString()}`}
                </p>
                {timesheet.approvalNotes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Notes: {timesheet.approvalNotes}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {timesheet.status === 'locked' && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800">Timesheet is locked for payroll</p>
                <p className="text-sm text-purple-700 mt-1">
                  Locked by: {timesheet.lockedBy?.firstName} {timesheet.lockedBy?.lastName}
                  {timesheet.lockedAt &&
                    ` on ${new Date(timesheet.lockedAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

