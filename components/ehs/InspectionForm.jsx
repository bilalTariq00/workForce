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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, XCircle, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function InspectionForm({ sites, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    siteId: '',
    type: 'safety',
    title: '',
    inspectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    overallRating: '',
    followUpRequired: false,
    followUpDate: '',
    checklistItems: [],
  });

  const [newChecklistItem, setNewChecklistItem] = useState({
    category: '',
    item: '',
    status: 'pass',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        inspectionDate: formData.inspectionDate,
        followUpDate: formData.followUpDate || undefined,
        checklistItems: formData.checklistItems,
      };

      const response = await fetch('/api/v1/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create inspection');
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating inspection:', err);
      setError(err.message || 'Failed to create inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.category || !newChecklistItem.item) {
      setError('Please fill in category and item');
      return;
    }

    setFormData({
      ...formData,
      checklistItems: [...formData.checklistItems, { ...newChecklistItem }],
    });

    setNewChecklistItem({
      category: '',
      item: '',
      status: 'pass',
      notes: '',
    });
  };

  const removeChecklistItem = (index) => {
    setFormData({
      ...formData,
      checklistItems: formData.checklistItems.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Inspection</DialogTitle>
          <DialogDescription className="text-sm">
            Create a new site inspection with checklist items
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Site Selection */}
          <div>
            <Label htmlFor="siteId">Site *</Label>
            <Select
              value={formData.siteId}
              onValueChange={(value) => setFormData({ ...formData, siteId: value })}
            >
              <SelectTrigger id="siteId">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site._id} value={site._id}>
                    {site.name} ({site.siteCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inspection Type */}
          <div>
            <Label htmlFor="type">Inspection Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekly Safety Inspection"
              required
            />
          </div>

          {/* Inspection Date */}
          <div>
            <Label htmlFor="inspectionDate">Inspection Date *</Label>
            <Input
              id="inspectionDate"
              type="datetime-local"
              value={formData.inspectionDate}
              onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="General observations and notes..."
              rows={4}
            />
          </div>

          {/* Overall Rating */}
          <div>
            <Label htmlFor="overallRating">Overall Rating</Label>
            <Select
              value={formData.overallRating}
              onValueChange={(value) => setFormData({ ...formData, overallRating: value })}
            >
              <SelectTrigger id="overallRating">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="satisfactory">Satisfactory</SelectItem>
                <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Follow-up */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) =>
                  setFormData({ ...formData, followUpRequired: e.target.checked })
                }
                className="rounded"
              />
              <Label htmlFor="followUpRequired">Follow-up Required</Label>
            </div>
            {formData.followUpRequired && (
              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                />
              </div>
            )}
          </div>

          {/* Checklist Items */}
          <div>
            <Label className="text-sm sm:text-base">Checklist Items</Label>
            <div className="mt-2 space-y-2 sm:space-y-3">
              {formData.checklistItems.map((item, index) => (
                <div key={index} className="p-2 sm:p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {item.category}: {item.item}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {item.status} {item.notes && `- ${item.notes}`}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeChecklistItem(index)}
                      className="flex-shrink-0"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="p-2 sm:p-3 border rounded-lg space-y-2 sm:space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    placeholder="Category"
                    value={newChecklistItem.category}
                    onChange={(e) =>
                      setNewChecklistItem({ ...newChecklistItem, category: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                  <Input
                    placeholder="Item"
                    value={newChecklistItem.item}
                    onChange={(e) =>
                      setNewChecklistItem({ ...newChecklistItem, item: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    value={newChecklistItem.status}
                    onValueChange={(value) =>
                      setNewChecklistItem({ ...newChecklistItem, status: value })
                    }
                  >
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Notes (optional)"
                    value={newChecklistItem.notes}
                    onChange={(e) =>
                      setNewChecklistItem({ ...newChecklistItem, notes: e.target.value })
                    }
                    className="text-sm sm:text-base"
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addChecklistItem}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Checklist Item
                </Button>
              </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Inspection'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

