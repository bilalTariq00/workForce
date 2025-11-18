'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Send, XCircle } from 'lucide-react';

const variationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  cost: z.number().min(0, 'Cost must be positive'),
  delayDays: z.number().min(0, 'Delay days must be non-negative'),
});

export default function VariationForm({ siteId, variation, onSuccess }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingForApproval, setIsSubmittingForApproval] = useState(false);
  const [error, setError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(variationSchema),
    defaultValues: variation || {
      title: '',
      description: '',
      cost: 0,
      delayDays: 0,
    },
  });

  const cost = watch('cost');
  const delayDays = watch('delayDays');

  const onSubmit = async (data, submitForApproval = false) => {
    if (submitForApproval) {
      setIsSubmittingForApproval(true);
    } else {
      setIsSubmitting(true);
    }
    setError(null);

    try {
      const url = variation
        ? `/api/v1/variations/${variation._id}`
        : '/api/v1/variations';
      const method = variation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          siteId,
          status: submitForApproval ? 'pending' : 'draft',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to save variation');
      }

      // If submitting for approval, call submit endpoint
      if (submitForApproval && result.data._id) {
        const submitResponse = await fetch(
          `/api/v1/variations/${result.data._id}/submit`,
          {
            method: 'POST',
          }
        );

        const submitResult = await submitResponse.json();
        if (!submitResult.success) {
          throw new Error(submitResult.error?.message || 'Failed to submit variation');
        }
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/site-manager/variations?success=true');
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to save variation');
    } finally {
      setIsSubmitting(false);
      setIsSubmittingForApproval(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {variation ? 'Edit Variation' : 'Create Variation / Change Order'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data, false))}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., Additional Foundation Work"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide detailed description of the variation..."
              rows={6}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Cost and Delay */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Additional Cost (£) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                {...register('cost', { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.cost && (
                <p className="mt-1 text-sm text-red-500">{errors.cost.message}</p>
              )}
              {cost > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Intl.NumberFormat('en-GB', {
                    style: 'currency',
                    currency: 'GBP',
                  }).format(cost)}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="delayDays">Project Delay (Days) *</Label>
              <Input
                id="delayDays"
                type="number"
                min="0"
                {...register('delayDays', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.delayDays && (
                <p className="mt-1 text-sm text-red-500">{errors.delayDays.message}</p>
              )}
              {delayDays > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {delayDays} day{delayDays !== 1 ? 's' : ''} delay
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting || isSubmittingForApproval}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save as Draft
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSubmit((data) => onSubmit(data, true))}
              disabled={isSubmitting || isSubmittingForApproval}
            >
              {isSubmittingForApproval ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit for Approval
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

