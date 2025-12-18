'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Timesheet Adjustment Modal
 * 
 * Purpose: Allow HR to manually adjust hours on a timesheet with audit trail
 * 
 * Props:
 * - isOpen: Boolean - Whether modal is open
 * - onClose: Function - Callback to close modal
 * - timesheet: Object - Timesheet object
 * - dayIndex: Number - Index of the day to adjust
 * - onAdjust: Function - Callback after successful adjustment
 */
export default function TimesheetAdjustmentModal({
  isOpen,
  onClose,
  timesheet,
  dayIndex,
  onAdjust,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize form when day changes
  const day = timesheet?.hours?.[dayIndex];
  const originalHours = day?.hours || 0;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && day) {
      setHours(day.hours?.toString() || '0');
      setReason('');
      setNotes('');
      setError('');
    }
  }, [isOpen, dayIndex, day]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    const adjustedHours = parseFloat(hours);
    if (isNaN(adjustedHours) || adjustedHours < 0 || adjustedHours > 24) {
      setError('Hours must be between 0 and 24');
      return;
    }

    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }

    if (adjustedHours === originalHours) {
      setError('Adjusted hours must be different from original hours');
      return;
    }

    // Check if timesheet is locked
    if (timesheet.status === 'locked') {
      setError('Cannot adjust locked timesheet');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/timesheets/${timesheet._id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: day.date,
          originalHours,
          adjustedHours,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setHours('');
        setReason('');
        setNotes('');
        setError('');
        
        // Call callback
        if (onAdjust) {
          onAdjust(result.data);
        }
        
        // Close modal
        onClose();
      } else {
        setError(result.error?.message || 'Failed to adjust timesheet');
      }
    } catch (err) {
      console.error('Error adjusting timesheet:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!timesheet || !day) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Adjust Timesheet Hours
          </DialogTitle>
          <DialogDescription>
            Make a manual adjustment to the timesheet. This will be recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Date Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Date</Label>
                  <p className="font-semibold">{formatDate(day.date)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Current Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="originalHours">Original Hours</Label>
                <Input
                  id="originalHours"
                  value={originalHours}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="adjustedHours">Adjusted Hours *</Label>
                <Input
                  id="adjustedHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.25"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <Label htmlFor="reason">Reason for Adjustment *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="e.g., Employee forgot to clock out, System error, etc."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reason.length}/500 characters
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={2}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/1000 characters
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warning if timesheet is not draft */}
            {timesheet.status !== 'draft' && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <p className="text-sm">
                      This timesheet is {timesheet.status}. Adjustments will be recorded in the audit trail.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Save Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

