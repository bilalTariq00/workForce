'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function CreatePayrollRunModal({ onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [selectedTimesheets, setSelectedTimesheets] = useState([]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    fetchAvailableTimesheets();
  }, []);

  const fetchAvailableTimesheets = async () => {
    try {
      const response = await fetch('/api/v1/timesheets?status=locked');
      const result = await response.json();

      if (result.success) {
        setTimesheets(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!periodStart || !periodEnd) {
        setError('Please select both start and end dates');
        setIsSubmitting(false);
        return;
      }

      if (selectedTimesheets.length === 0) {
        setError('Please select at least one timesheet');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/v1/payroll-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodStart,
          periodEnd,
          timesheetIds: selectedTimesheets,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to create payroll run');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating payroll run:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const toggleTimesheet = (timesheetId) => {
    if (selectedTimesheets.includes(timesheetId)) {
      setSelectedTimesheets(selectedTimesheets.filter((id) => id !== timesheetId));
    } else {
      setSelectedTimesheets([...selectedTimesheets, timesheetId]);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Payroll Run</DialogTitle>
          <DialogDescription>
            Select pay period and timesheets to include in this payroll run
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pay Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodStart">Period Start *</Label>
              <div className="relative">
                <Input
                  id="periodStart"
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <Label htmlFor="periodEnd">Period End *</Label>
              <div className="relative">
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  min={periodStart || today}
                  required
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Timesheets Selection */}
          <div>
            <Label>Select Timesheets * ({selectedTimesheets.length} selected)</Label>
            <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
              {timesheets.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No locked timesheets available</p>
                  <p className="text-xs mt-1">Timesheets must be locked before including in payroll</p>
                </div>
              ) : (
                <div className="divide-y">
                  {timesheets.map((timesheet) => (
                    <label
                      key={timesheet._id}
                      className="flex items-center p-3 hover:bg-muted cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTimesheets.includes(timesheet._id)}
                        onChange={() => toggleTimesheet(timesheet._id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {timesheet.employeeId?.firstName} {timesheet.employeeId?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Week: {format(new Date(timesheet.weekStartDate), 'MMM dd')} -{' '}
                          {format(new Date(timesheet.weekEndDate), 'MMM dd, yyyy')} |{' '}
                          {timesheet.totalHours} hours
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedTimesheets.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payroll Run'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

