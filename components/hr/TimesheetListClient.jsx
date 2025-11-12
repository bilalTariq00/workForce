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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  FileText,
  CheckCircle2,
  Lock,
  RefreshCw,
  Calendar,
  Download,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Timesheet List Client Component
 * 
 * Displays list of timesheets with filters and actions
 */
export default function TimesheetListClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [timesheets, setTimesheets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('');

  // Fetch timesheets
  const fetchTimesheets = async () => {
    try {
      setError('');
      let url = '/api/v1/timesheets?';
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (weekFilter) {
        url += `weekStartDate=${weekFilter}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setTimesheets(result.data);
      } else {
        setError(result.error?.message || 'Failed to load timesheets');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching timesheets:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTimesheets();
  }, [statusFilter, weekFilter]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTimesheets();
  };

  // Generate timesheets for current week
  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/timesheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generateForAll: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.refresh();
        fetchTimesheets();
      } else {
        setError(result.error?.message || 'Failed to generate timesheets');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Draft
        </span>
      ),
      submitted: (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Submitted
        </span>
      ),
      approved: (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </span>
      ),
      locked: (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Lock className="h-3 w-3 mr-1" />
          Locked
        </span>
      ),
    };
    return badges[status] || badges.draft;
  };

  const formatWeek = (weekStartDate) => {
    const start = new Date(weekStartDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  if (loading && timesheets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Timesheet Approval</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve employee timesheets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleGenerate} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate All
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                placeholder="Filter by week"
                className="w-auto"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheets ({timesheets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {timesheets.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No timesheets found</p>
              <Button onClick={handleGenerate}>Generate Timesheets</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Week</TableHead>
                    <TableHead>Total Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((timesheet) => (
                    <TableRow key={timesheet._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {timesheet.employeeId?.firstName} {timesheet.employeeId?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timesheet.employeeId?.employeeId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatWeek(timesheet.weekStartDate)}</TableCell>
                      <TableCell className="font-semibold">{timesheet.totalHours}h</TableCell>
                      <TableCell>{getStatusBadge(timesheet.status)}</TableCell>
                      <TableCell>
                        {timesheet.approvedBy
                          ? `${timesheet.approvedBy.firstName} ${timesheet.approvedBy.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Link href={`/hr/timesheets/${timesheet._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

