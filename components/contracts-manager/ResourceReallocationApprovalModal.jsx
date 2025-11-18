'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, ArrowRight, Users, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function ResourceReallocationApprovalModal({
  reallocation,
  onClose,
  onSuccess,
}) {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!action) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/v1/resource-reallocations/${reallocation._id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            approvalNotes: action === 'approve' ? approvalNotes : undefined,
            rejectionReason: action === 'reject' ? rejectionReason : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to process reallocation');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error processing reallocation:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Resource Re-Allocation</DialogTitle>
          <DialogDescription>
            Review and approve or reject this resource reallocation request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resource Type */}
          <div>
            <Label className="text-muted-foreground">Resource Type</Label>
            <div className="flex items-center gap-2 mt-1">
              {reallocation.resourceType === 'crew' ? (
                <Users className="h-5 w-5" />
              ) : (
                <Truck className="h-5 w-5" />
              )}
              <p className="font-medium capitalize">{reallocation.resourceType}</p>
            </div>
          </div>

          {/* Sites */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">From Site</Label>
              <p className="font-medium">
                {reallocation.fromSiteId?.name} ({reallocation.fromSiteId?.siteCode})
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">To Site</Label>
              <p className="font-medium">
                {reallocation.toSiteId?.name} ({reallocation.toSiteId?.siteCode})
              </p>
            </div>
          </div>

          {/* Employees (for crew) */}
          {reallocation.resourceType === 'crew' && reallocation.employeeIds && (
            <div>
              <Label className="text-muted-foreground">Employees</Label>
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <ul className="list-disc list-inside space-y-1">
                  {reallocation.employeeIds.map((emp) => (
                    <li key={emp._id} className="text-sm">
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Plant/Equipment Details */}
          {(reallocation.resourceType === 'plant' ||
            reallocation.resourceType === 'equipment') &&
            reallocation.plantDetails && (
              <div>
                <Label className="text-muted-foreground">
                  {reallocation.resourceType === 'plant' ? 'Plant' : 'Equipment'} Details
                </Label>
                <div className="mt-2 p-3 bg-muted rounded-lg space-y-1">
                  <p className="text-sm">
                    <strong>Name:</strong> {reallocation.plantDetails.name}
                  </p>
                  {reallocation.plantDetails.type && (
                    <p className="text-sm">
                      <strong>Type:</strong> {reallocation.plantDetails.type}
                    </p>
                  )}
                  {reallocation.plantDetails.registrationNumber && (
                    <p className="text-sm">
                      <strong>Registration:</strong>{' '}
                      {reallocation.plantDetails.registrationNumber}
                    </p>
                  )}
                  {reallocation.plantDetails.description && (
                    <p className="text-sm">
                      <strong>Description:</strong> {reallocation.plantDetails.description}
                    </p>
                  )}
                </div>
              </div>
            )}

          {/* Effective Date */}
          <div>
            <Label className="text-muted-foreground">Effective Date</Label>
            <p className="font-medium">
              {format(new Date(reallocation.effectiveDate), 'MMM dd, yyyy')}
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-muted-foreground">Reason</Label>
            <p className="text-sm mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
              {reallocation.reason}
            </p>
          </div>

          {/* Requested By */}
          <div>
            <Label className="text-muted-foreground">Requested By</Label>
            <p className="font-medium">
              {reallocation.requestedBy?.firstName} {reallocation.requestedBy?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(reallocation.createdAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Approval Action *</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={action === 'approve' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setAction('approve');
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                type="button"
                variant={action === 'reject' ? 'destructive' : 'outline'}
                className="flex-1"
                onClick={() => {
                  setAction('reject');
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>

          {/* Approval Notes (for approval) */}
          {action === 'approve' && (
            <div>
              <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes or comments..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          {/* Rejection Reason (for rejection) */}
          {action === 'reject' && (
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this reallocation..."
                rows={3}
                className="mt-2"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || isSubmitting}
            variant={action === 'reject' ? 'destructive' : 'default'}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Reallocation
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Reallocation
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

