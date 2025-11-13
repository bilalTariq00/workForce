'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const leaveRequestSchema = z.object({
  type: z.enum(['annual', 'sick', 'unpaid', 'compassionate'], {
    required_error: 'Please select a leave type',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
});

export default function LeaveRequestForm({ employeeId, annualLeaveBalance }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      type: 'annual',
      startDate: '',
      endDate: '',
      reason: '',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const leaveType = watch('type');

  // Calculate days excluding weekends
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    let days = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // Update calculated days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const days = calculateDays(startDate, endDate);
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate dates
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (start < new Date()) {
        setError('Start date must be in the future');
        setIsSubmitting(false);
        return;
      }

      if (end < start) {
        setError('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      // Check annual leave balance
      if (data.type === 'annual') {
        const days = calculateDays(data.startDate, data.endDate);
        if (annualLeaveBalance < days) {
          setError(
            `Insufficient annual leave balance. Available: ${annualLeaveBalance} days, Requested: ${days} days`
          );
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch('/api/v1/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error?.message || 'Failed to create leave request');
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to dashboard or show success message
      router.push('/dashboard?leaveRequestSuccess=true');
    } catch (err) {
      console.error('Error creating leave request:', err);
      setError('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Request Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Leave Type */}
          <div>
            <Label htmlFor="type">Leave Type *</Label>
            <Select
              onValueChange={(value) => setValue('type', value)}
              defaultValue="annual"
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="compassionate">Compassionate Leave</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <div className="relative">
              <Input
                id="startDate"
                type="date"
                min={today}
                {...register('startDate')}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.startDate && (
              <p className="text-sm text-destructive mt-1">{errors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <Label htmlFor="endDate">End Date *</Label>
            <div className="relative">
              <Input
                id="endDate"
                type="date"
                min={startDate || today}
                {...register('endDate')}
                className="pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {errors.endDate && (
              <p className="text-sm text-destructive mt-1">{errors.endDate.message}</p>
            )}
          </div>

          {/* Calculated Days */}
          {startDate && endDate && calculatedDays > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Number of days (excluding weekends): <span className="font-semibold">{calculatedDays}</span>
              </p>
              {leaveType === 'annual' && (
                <p className="text-sm text-muted-foreground mt-1">
                  Balance after request: <span className="font-semibold">{annualLeaveBalance - calculatedDays} days</span>
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request..."
              rows={4}
              maxLength={500}
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-sm text-destructive mt-1">{errors.reason.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Maximum 500 characters
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

