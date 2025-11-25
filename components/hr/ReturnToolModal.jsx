'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Loader2 } from 'lucide-react';
import { useReturnTool } from '@/lib/hooks/useTools';

export default function ReturnToolModal({ open, onClose, assignment }) {
  const returnTool = useReturnTool();
  const [formData, setFormData] = useState({
    actualReturnDate: new Date().toISOString().slice(0, 16),
    returnCondition: 'good',
    notes: '',
    finePaid: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await returnTool.mutateAsync({
        assignmentId: assignment._id,
        returnData: {
          ...formData,
          actualReturnDate: formData.actualReturnDate,
        },
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to return tool');
    }
  };

  if (!assignment) return null;

  // Calculate fine
  const returnDate = new Date(formData.actualReturnDate);
  const expectedDate = new Date(assignment.expectedReturnDate);
  const daysLate = Math.ceil((returnDate - expectedDate) / (1000 * 60 * 60 * 24));
  const finePerDay = assignment.toolId?.finePerDay || 0;
  const calculatedFine = daysLate > 1 ? daysLate * finePerDay * assignment.quantity : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return Tool</DialogTitle>
          <DialogDescription>
            Record the return of {assignment.toolId?.name || 'tool'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm">
              <strong>Tool:</strong> {assignment.toolId?.name || 'N/A'}
            </p>
            <p className="text-sm">
              <strong>Employee:</strong> {assignment.employeeId?.firstName}{' '}
              {assignment.employeeId?.lastName}
            </p>
            <p className="text-sm">
              <strong>Quantity:</strong> {assignment.quantity}
            </p>
            <p className="text-sm">
              <strong>Expected Return:</strong>{' '}
              {new Date(assignment.expectedReturnDate).toLocaleDateString()}
            </p>
            {daysLate > 1 && (
              <p className="text-sm text-red-600 font-semibold">
                <strong>Days Late:</strong> {daysLate} days
              </p>
            )}
            {calculatedFine > 0 && (
              <p className="text-sm text-red-600 font-semibold">
                <strong>Fine Amount:</strong> £{calculatedFine.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="actualReturnDate">Actual Return Date *</Label>
            <Input
              id="actualReturnDate"
              type="datetime-local"
              value={formData.actualReturnDate}
              onChange={(e) => setFormData({ ...formData, actualReturnDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="returnCondition">Condition *</Label>
            <Select
              value={formData.returnCondition}
              onValueChange={(value) => setFormData({ ...formData, returnCondition: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {calculatedFine > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="finePaid"
                checked={formData.finePaid}
                onChange={(e) => setFormData({ ...formData, finePaid: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="finePaid" className="cursor-pointer">
                Fine has been paid
              </Label>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Any additional notes about the return..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={returnTool.isPending}>
              {returnTool.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Return Tool
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

