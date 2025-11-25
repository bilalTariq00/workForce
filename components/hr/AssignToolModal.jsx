'use client';

import { useState, useEffect } from 'react';
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
import { useAssignTool } from '@/lib/hooks/useTools';
import { useTools } from '@/lib/hooks/useTools';
import { useEmployees } from '@/lib/hooks/useEmployees';

export default function AssignToolModal({ open, onClose, tool }) {
  const [formData, setFormData] = useState({
    toolId: tool?._id || '',
    employeeId: '',
    quantity: 1,
    expectedReturnDate: '',
    notes: '',
  });

  // Use TanStack Query hooks
  const { data: toolsData } = useTools({ status: 'active' });
  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const assignTool = useAssignTool();

  const tools = toolsData?.tools || [];
  const employeesList = employees || [];

  useEffect(() => {
    if (open && tool) {
      setFormData({
        toolId: tool._id,
        employeeId: '',
        quantity: 1,
        expectedReturnDate: '',
        notes: '',
      });
    }
  }, [open, tool]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await assignTool.mutateAsync({
        ...formData,
        expectedReturnDate: formData.expectedReturnDate,
      });
      // Reset form and close modal
      setFormData({
        toolId: tool?._id || '',
        employeeId: '',
        quantity: 1,
        expectedReturnDate: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to assign tool');
    }
  };

  const selectedTool = tools.find((t) => t._id === formData.toolId);
  const maxQuantity = selectedTool?.availableQuantity || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Tool</DialogTitle>
          <DialogDescription>
            Assign a tool to an employee
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="toolId">Tool *</Label>
            <Select
              value={formData.toolId}
              onValueChange={(value) => setFormData({ ...formData, toolId: value, quantity: 1 })}
              disabled={!!tool}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tool" />
              </SelectTrigger>
              <SelectContent>
                {tools
                  .filter((t) => t.availableQuantity > 0)
                  .map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name} ({t.availableQuantity} available)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedTool && (
              <p className="text-sm text-muted-foreground mt-1">
                Available: {selectedTool.availableQuantity} {selectedTool.unit}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="employeeId">Employee *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employeesLoading ? (
                  <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                ) : employeesList.length === 0 ? (
                  <SelectItem value="none" disabled>No employees found</SelectItem>
                ) : (
                  employeesList
                    .filter((e) => e.status === 'active')
                    .map((emp) => {
                      const roleLabel = emp.role
                        ?.split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ') || emp.role;
                      return (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName} - {roleLabel} ({emp.employeeId})
                        </SelectItem>
                      );
                    })
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
              required
            />
            {maxQuantity > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Maximum: {maxQuantity}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="expectedReturnDate">Expected Return Date *</Label>
            <Input
              id="expectedReturnDate"
              type="datetime-local"
              value={formData.expectedReturnDate}
              onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={assignTool.isPending || !selectedTool || maxQuantity === 0}>
              {assignTool.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign Tool
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

