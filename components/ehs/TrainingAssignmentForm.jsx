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
import { Loader2, XCircle } from 'lucide-react';

export default function TrainingAssignmentForm({ employees, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    trainingType: 'SafePass',
    title: '',
    description: '',
    isMandatory: true,
    dueDate: '',
    expiryDate: '',
    provider: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate,
        expiryDate: formData.expiryDate || undefined,
      };

      const response = await fetch('/api/v1/training-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to assign training');
      }

      onSuccess();
    } catch (err) {
      console.error('Error assigning training:', err);
      setError(err.message || 'Failed to assign training');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Assign Training</DialogTitle>
          <DialogDescription className="text-sm">
            Assign mandatory or optional training to an employee
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Employee Selection */}
          <div>
            <Label htmlFor="employeeId">Employee *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger id="employeeId">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Training Type */}
          <div>
            <Label htmlFor="trainingType">Training Type *</Label>
            <Select
              value={formData.trainingType}
              onValueChange={(value) => setFormData({ ...formData, trainingType: value })}
            >
              <SelectTrigger id="trainingType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SafePass">SafePass</SelectItem>
                <SelectItem value="CSCS">CSCS</SelectItem>
                <SelectItem value="FirstAid">First Aid</SelectItem>
                <SelectItem value="ManualHandling">Manual Handling</SelectItem>
                <SelectItem value="WorkingAtHeight">Working at Height</SelectItem>
                <SelectItem value="ConfinedSpace">Confined Space</SelectItem>
                <SelectItem value="FireSafety">Fire Safety</SelectItem>
                <SelectItem value="ToolboxTalk">Toolbox Talk</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
              placeholder="e.g., SafePass Renewal 2024"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Training description and requirements..."
              rows={3}
            />
          </div>

          {/* Mandatory Flag */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMandatory"
              checked={formData.isMandatory}
              onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="isMandatory" className="cursor-pointer">
              Mandatory Training
            </Label>
          </div>

          {/* Due Date */}
          <div>
            <Label htmlFor="dueDate">Due Date *</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          {/* Expiry Date */}
          <div>
            <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              If training expires, set the expiry date
            </p>
          </div>

          {/* Provider */}
          <div>
            <Label htmlFor="provider">Training Provider</Label>
            <Input
              id="provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              placeholder="e.g., CITB, Internal Training"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
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
                  Assigning...
                </>
              ) : (
                'Assign Training'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

