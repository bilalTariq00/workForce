'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  Users,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import ResourceReallocationApprovalModal from './ResourceReallocationApprovalModal';
import { useRouter } from 'next/navigation';

export default function ResourceReallocationList() {
  const router = useRouter();
  const [reallocations, setReallocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReallocation, setSelectedReallocation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchReallocations();
  }, [filterStatus, filterType]);

  const fetchReallocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('resourceType', filterType);

      const response = await fetch(`/api/v1/resource-reallocations?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch resource reallocations');
      }

      setReallocations(result.data);
    } catch (err) {
      console.error('Error fetching reallocations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalSuccess = () => {
    setSelectedReallocation(null);
    fetchReallocations();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'crew':
        return <Users className="h-4 w-4" />;
      case 'plant':
      case 'equipment':
        return <Truck className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading reallocations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchReallocations} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingReallocations = reallocations.filter((r) => r.status === 'pending');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Resource Re-Allocations ({reallocations.length})
            {pendingReallocations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingReallocations.length} Pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="crew">Crew</SelectItem>
                <SelectItem value="plant">Plant</SelectItem>
                <SelectItem value="equipment">Equipment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reallocations List */}
          {reallocations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No resource reallocations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reallocations.map((reallocation) => (
                <div
                  key={reallocation._id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getResourceTypeIcon(reallocation.resourceType)}
                        <h3 className="font-semibold text-foreground capitalize">
                          {reallocation.resourceType} Reallocation
                        </h3>
                        {getStatusBadge(reallocation.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span className="font-medium">
                          {reallocation.fromSiteId?.name} ({reallocation.fromSiteId?.siteCode})
                        </span>
                        <ArrowRight className="h-4 w-4" />
                        <span className="font-medium">
                          {reallocation.toSiteId?.name} ({reallocation.toSiteId?.siteCode})
                        </span>
                      </div>
                      {reallocation.resourceType === 'crew' && reallocation.employeeIds && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Employees:</strong>{' '}
                          {reallocation.employeeIds
                            .map((emp) => `${emp.firstName} ${emp.lastName}`)
                            .join(', ')}
                        </p>
                      )}
                      {(reallocation.resourceType === 'plant' ||
                        reallocation.resourceType === 'equipment') &&
                        reallocation.plantDetails && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>{reallocation.resourceType === 'plant' ? 'Plant' : 'Equipment'}:</strong>{' '}
                            {reallocation.plantDetails.name}
                            {reallocation.plantDetails.type &&
                              ` (${reallocation.plantDetails.type})`}
                          </p>
                        )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {reallocation.reason}
                      </p>
                    </div>
                    {reallocation.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedReallocation(reallocation)}
                        className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm"
                      >
                        Review
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effective Date:</span>
                      <p className="font-medium">
                        {format(new Date(reallocation.effectiveDate), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested By:</span>
                      <p className="font-medium">
                        {reallocation.requestedBy?.firstName}{' '}
                        {reallocation.requestedBy?.lastName}
                      </p>
                    </div>
                  </div>

                  {reallocation.approvedBy && (
                    <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                      {reallocation.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                      {reallocation.approvedBy?.firstName} {reallocation.approvedBy?.lastName} on{' '}
                      {format(new Date(reallocation.approvedAt), 'MMM dd, yyyy')}
                    </div>
                  )}

                  {reallocation.approvalNotes && (
                    <div className="mt-3 p-2 sm:p-3 bg-muted rounded">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <strong>Approval Notes:</strong> {reallocation.approvalNotes}
                      </p>
                    </div>
                  )}

                  {reallocation.rejectionReason && (
                    <div className="mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400">
                        <strong>Rejection Reason:</strong> {reallocation.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedReallocation && (
        <ResourceReallocationApprovalModal
          reallocation={selectedReallocation}
          onClose={() => setSelectedReallocation(null)}
          onSuccess={handleApprovalSuccess}
        />
      )}
    </>
  );
}

