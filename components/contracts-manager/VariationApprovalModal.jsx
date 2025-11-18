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

export default function VariationApprovalModal({
  variation,
  onClose,
  onSuccess,
}) {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [commercialNotes, setCommercialNotes] = useState('');
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
      const response = await fetch(`/api/v1/variations/${variation._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          commercialNotes: action === 'approve' ? commercialNotes : undefined,
          rejectionReason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to process variation');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error processing variation:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Variation / Change Order</DialogTitle>
          <DialogDescription>
            Review and approve or reject this variation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Variation Details */}
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <p className="font-medium">{variation.title}</p>
          </div>

          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="text-sm mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
              {variation.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Site</Label>
              <p className="font-medium">
                {variation.siteId?.name} ({variation.siteId?.siteCode})
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Site Manager</Label>
              <p className="font-medium">
                {variation.siteManagerId?.firstName} {variation.siteManagerId?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {variation.siteManagerId?.employeeId}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Additional Cost</Label>
              <p className="font-medium text-lg">
                {new Intl.NumberFormat('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                }).format(variation.cost)}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Project Delay</Label>
              <p className="font-medium text-lg">
                {variation.delayDays} day{variation.delayDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Created</Label>
            <p className="font-medium">
              {format(new Date(variation.createdAt), 'MMM dd, yyyy HH:mm')}
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

          {/* Commercial Notes (for approval) */}
          {action === 'approve' && (
            <div>
              <Label htmlFor="commercialNotes">Commercial Notes (Optional)</Label>
              <Textarea
                id="commercialNotes"
                value={commercialNotes}
                onChange={(e) => setCommercialNotes(e.target.value)}
                placeholder="Add any commercial notes or comments..."
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
                placeholder="Please provide a reason for rejecting this variation..."
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
                    Approve Variation
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Variation
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

