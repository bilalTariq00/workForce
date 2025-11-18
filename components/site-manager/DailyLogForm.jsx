'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Using standard textarea element
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DeliveryItem from './DeliveryItem';
import { Plus, Save, Lock, Send, Trash2 } from 'lucide-react';

/**
 * Daily Log Form Component
 * 
 * Purpose: Site Managers use this form to create and edit daily site logs
 * 
 * Features:
 * - Weather input
 * - Headcount (actual vs planned)
 * - Material deliveries (add/remove)
 * - Issues/notes
 * - Save as draft
 * - Lock & Send to Contracts Manager
 * 
 * Props:
 * - initialData: Existing daily log data (if editing)
 * - siteId: ID of the site
 * - siteName: Name of the site (for display)
 */
export default function DailyLogForm({ initialData, siteId, siteName }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state - initialize with existing data or defaults
  const [formData, setFormData] = useState({
    weather: initialData?.weather || '',
    headcount: initialData?.headcount ?? 0,
    plannedHeadcount: initialData?.plannedHeadcount ?? 0,
    deliveries: initialData?.deliveries || [],
    issues: initialData?.issues || '',
  });

  // Date for the log (today's date)
  const logDate = new Date().toISOString().split('T')[0];

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'headcount' || name === 'plannedHeadcount' 
        ? parseInt(value) || 0 
        : value,
    }));
  };

  /**
   * Add a new delivery to the list
   */
  const handleAddDelivery = () => {
    setFormData((prev) => ({
      ...prev,
      deliveries: [
        ...prev.deliveries,
        {
          material: '',
          docketNumber: '',
          docketPhoto: '',
          poMatchStatus: 'pending',
        },
      ],
    }));
  };

  /**
   * Update a delivery item
   */
  const handleUpdateDelivery = (index, updatedDelivery) => {
    setFormData((prev) => {
      const newDeliveries = [...prev.deliveries];
      newDeliveries[index] = updatedDelivery;
      return {
        ...prev,
        deliveries: newDeliveries,
      };
    });
  };

  /**
   * Remove a delivery from the list
   */
  const handleRemoveDelivery = (index) => {
    setFormData((prev) => ({
      ...prev,
      deliveries: prev.deliveries.filter((_, i) => i !== index),
    }));
  };

  /**
   * Save the log as draft
   * Creates a new log or updates existing draft
   */
  const handleSaveDraft = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const url = initialData 
        ? `/api/v1/daily-logs/${initialData._id}` 
        : '/api/v1/daily-logs';
      
      const method = initialData ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          date: logDate,
          weather: formData.weather,
          headcount: formData.headcount,
          plannedHeadcount: formData.plannedHeadcount,
          deliveries: formData.deliveries.filter(
            (d) => d.material && d.docketNumber && d.docketPhoto
          ), // Only include complete deliveries
          issues: formData.issues,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Daily log saved as draft');
        // Refresh the page to show updated data
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(result.error?.message || 'Failed to save daily log');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Lock the log (cannot edit after this)
   * Requires headcount to be set
   */
  const handleLock = async () => {
    if (!initialData) {
      setError('Please save the log first before locking');
      return;
    }

    if (!confirm('Are you sure you want to lock this log? You will not be able to edit it after locking.')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/daily-logs/${initialData._id}/lock`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Daily log locked successfully');
        // Refresh the page to show locked status
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(result.error?.message || 'Failed to lock daily log');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send the locked log to Contracts Manager
   */
  const handleSend = async () => {
    if (!initialData) {
      setError('No log to send');
      return;
    }

    if (!confirm('Send this daily log to the Contracts Manager?')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/daily-logs/${initialData._id}/send`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Daily log sent to Contracts Manager successfully');
        // Refresh the page
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } else {
        setError(result.error?.message || 'Failed to send daily log');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Main Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Daily Site Log - {siteName}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Fill in the details below. You can save as draft and complete later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Weather */}
          <div>
            <label htmlFor="weather" className="block text-sm font-medium text-foreground mb-2">
              Weather Conditions
            </label>
            <Input
              type="text"
              id="weather"
              name="weather"
              value={formData.weather}
              onChange={handleChange}
              placeholder="e.g., Sunny, Rainy, Windy"
              className="w-full"
            />
          </div>

          {/* Headcount Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="headcount" className="block text-sm font-medium text-foreground mb-2">
                Actual Headcount *
              </label>
              <Input
                type="number"
                id="headcount"
                name="headcount"
                value={formData.headcount}
                onChange={handleChange}
                min="0"
                required
                className="w-full"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of workers actually present today
              </p>
            </div>

            <div>
              <label htmlFor="plannedHeadcount" className="block text-sm font-medium text-foreground mb-2">
                Planned Headcount
              </label>
              <Input
                type="number"
                id="plannedHeadcount"
                name="plannedHeadcount"
                value={formData.plannedHeadcount}
                onChange={handleChange}
                min="0"
                className="w-full"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Number of workers expected today
              </p>
            </div>
          </div>

          {/* Deliveries Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground">
                Material Deliveries
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDelivery}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery
              </Button>
            </div>

            {formData.deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deliveries added. Click "Add Delivery" to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {formData.deliveries.map((delivery, index) => (
                  <DeliveryItem
                    key={index}
                    delivery={delivery}
                    index={index}
                    onUpdate={(updated) => handleUpdateDelivery(index, updated)}
                    onRemove={() => handleRemoveDelivery(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Issues/Notes */}
          <div>
            <label htmlFor="issues" className="block text-sm font-medium text-foreground mb-2">
              Issues / Notes
            </label>
            <textarea
              id="issues"
              name="issues"
              value={formData.issues}
              onChange={handleChange}
              rows={4}
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any issues, problems, or notes about today's work..."
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.issues.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {initialData ? 'Update Draft' : 'Save as Draft'}
            </Button>

            {initialData && initialData.status === 'draft' && (
              <>
                <Button
                  type="button"
                  onClick={handleLock}
                  disabled={loading || !formData.headcount}
                  className="flex-1"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Lock Log
                </Button>
              </>
            )}

            {initialData && initialData.status === 'locked' && (
              <Button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Send to Contracts Manager
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

