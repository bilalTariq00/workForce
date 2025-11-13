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
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function LeaveRequestApprovalModal({ request, onClose, onSuccess }) {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
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
      const response = await fetch(`/api/v1/leave-requests/${request._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to process leave request');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error processing leave request:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Leave Request</DialogTitle>
          <DialogDescription>
            Review and approve or reject this leave request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Employee</Label>
              <p className="font-medium">
                {request.employeeId?.firstName} {request.employeeId?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {request.employeeId?.employeeId}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Leave Type</Label>
              <p className="font-medium">{getTypeLabel(request.type)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Start Date</Label>
              <p className="font-medium">
                {format(new Date(request.startDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">End Date</Label>
              <p className="font-medium">
                {format(new Date(request.endDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Days */}
          <div>
            <Label className="text-muted-foreground">Number of Days</Label>
            <p className="font-medium">{request.days} days (excluding weekends)</p>
          </div>

          {/* Reason */}
          <div>
            <Label className="text-muted-foreground">Reason</Label>
            <p className="text-sm bg-muted p-3 rounded-md">{request.reason}</p>
          </div>

          {/* Status */}
          <div>
            <Label className="text-muted-foreground">Status</Label>
            <div>
              {request.status === 'pending' ? (
                <Badge variant="secondary">Pending</Badge>
              ) : request.status === 'approved' ? (
                <Badge className="bg-green-500">Approved</Badge>
              ) : (
                <Badge variant="destructive">Rejected</Badge>
              )}
            </div>
          </div>

          {/* Action Selection */}
          {request.status === 'pending' && (
            <>
              <div>
                <Label>Action *</Label>
                <div className="flex gap-3 mt-2">
                  <Button
                    type="button"
                    variant={action === 'approve' ? 'default' : 'outline'}
                    onClick={() => setAction('approve')}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant={action === 'reject' ? 'destructive' : 'outline'}
                    onClick={() => setAction('reject')}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Rejection Reason */}
              {action === 'reject' && (
                <div>
                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                  <Textarea
                    id="rejectionReason"
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    maxLength={500}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 500 characters
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {request.status === 'pending' && (
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
                      Approve
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

