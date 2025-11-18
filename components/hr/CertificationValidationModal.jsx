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
import { Loader2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function CertificationValidationModal({
  certification,
  onClose,
  onSuccess,
}) {
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
      const response = await fetch(
        `/api/v1/certifications/${certification._id}/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            rejectionReason: action === 'reject' ? rejectionReason : undefined,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to validate certification');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error validating certification:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Validate Certification</DialogTitle>
          <DialogDescription>
            Review and approve or reject this certification
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Employee</Label>
              <p className="font-medium">
                {certification.employeeId?.firstName}{' '}
                {certification.employeeId?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {certification.employeeId?.employeeId}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium text-sm">
                {certification.employeeId?.email}
              </p>
            </div>
          </div>

          {/* Certification Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Certification Type</Label>
              <p className="font-medium">{certification.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Document Type</Label>
              <Badge variant="outline" className="mt-1">
                {certification.documentType?.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Issue Date</Label>
              <p className="font-medium">
                {format(new Date(certification.issueDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Expiry Date</Label>
              <p className="font-medium">
                {format(new Date(certification.expiryDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Document Link */}
          {certification.documentUrl && (
            <div>
              <Label className="text-muted-foreground">Document</Label>
              <div className="mt-2">
                <a
                  href={certification.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  View Certification Document
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {certification.notes && (
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded">
                {certification.notes}
              </p>
            </div>
          )}

          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Validation Action *</Label>
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

          {/* Rejection Reason */}
          {action === 'reject' && (
            <div>
              <Label htmlFor="rejectionReason">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this certification..."
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
                    Approve Certification
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Certification
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

