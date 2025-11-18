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
import { Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import LeaveRequestApprovalModal from './LeaveRequestApprovalModal';

export default function LeaveRequestList() {
  const router = useRouter();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, [statusFilter]);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/v1/leave-requests?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setLeaveRequests(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    fetchLeaveRequests(); // Refresh list
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'annual':
        return 'Annual Leave';
      case 'sick':
        return 'Sick Leave';
      case 'unpaid':
        return 'Unpaid Leave';
      case 'compassionate':
        return 'Compassionate Leave';
      default:
        return type;
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
            <CardTitle className="text-lg sm:text-xl">Leave Requests ({leaveRequests.length})</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave requests found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {leaveRequests.map((request) => (
                  <Card key={request._id}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">
                              {request.employeeId?.firstName} {request.employeeId?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.employeeId?.employeeId}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Type:</span>
                            <p className="font-medium">{getTypeLabel(request.type)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Days:</span>
                            <p className="font-medium">{request.days} days</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Start:</span>
                            <p className="font-medium">
                              {format(new Date(request.startDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">End:</span>
                            <p className="font-medium">
                              {format(new Date(request.endDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        {request.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            className="w-full"
                          >
                            Review
                          </Button>
                        )}
                        {request.status !== 'pending' && request.approvedBy && (
                          <div className="text-xs text-muted-foreground">
                            {request.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                            {request.approvedBy.firstName} {request.approvedBy.lastName}
                            {request.approvedAt && (
                              <> on {format(new Date(request.approvedAt), 'MMM dd, yyyy')}</>
                            )}
                          </div>
                        )}
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
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaveRequests.map((request) => (
                      <TableRow key={request._id}>
                        <TableCell>
                          {request.employeeId?.firstName} {request.employeeId?.lastName}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {request.employeeId?.employeeId}
                          </span>
                        </TableCell>
                        <TableCell>{getTypeLabel(request.type)}</TableCell>
                        <TableCell>
                          {format(new Date(request.startDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.endDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{request.days} days</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(request)}
                            >
                              Review
                            </Button>
                          )}
                          {request.status !== 'pending' && (
                            <span className="text-xs text-muted-foreground">
                              {request.approvedBy
                                ? `By ${request.approvedBy.firstName} ${request.approvedBy.lastName}`
                                : 'N/A'}
                              <br />
                              {request.approvedAt
                                ? format(new Date(request.approvedAt), 'MMM dd, yyyy')
                                : ''}
                            </span>
                          )}
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

      {isModalOpen && selectedRequest && (
        <LeaveRequestApprovalModal
          request={selectedRequest}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </>
  );
}

