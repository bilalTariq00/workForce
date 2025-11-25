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
import { useCreateTool } from '@/lib/hooks/useTools';

export default function CreateToolModal({ open, onClose }) {
  const createTool = useCreateTool();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    brand: '',
    model: '',
    serialNumber: '',
    totalQuantity: 0,
    unit: 'unit',
    condition: 'good',
    location: '',
    cost: '',
    finePerDay: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createTool.mutateAsync({
        ...formData,
        totalQuantity: parseInt(formData.totalQuantity),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        finePerDay: formData.finePerDay ? parseFloat(formData.finePerDay) : undefined,
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        category: 'other',
        brand: '',
        model: '',
        serialNumber: '',
        totalQuantity: 0,
        unit: 'unit',
        condition: 'good',
        location: '',
        cost: '',
        finePerDay: '',
        notes: '',
      });
      onClose();
    } catch (error) {
      alert(error.message || 'Failed to create tool');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Tool</DialogTitle>
          <DialogDescription>
            Add a new tool to the inventory system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hand_tools">Hand Tools</SelectItem>
                  <SelectItem value="power_tools">Power Tools</SelectItem>
                  <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                  <SelectItem value="heavy_machinery">Heavy Machinery</SelectItem>
                  <SelectItem value="vehicles">Vehicles</SelectItem>
                  <SelectItem value="measuring_tools">Measuring Tools</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalQuantity">Total Quantity *</Label>
              <Input
                id="totalQuantity"
                type="number"
                min="0"
                value={formData.totalQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, totalQuantity: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => setFormData({ ...formData, unit: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit">Unit</SelectItem>
                  <SelectItem value="piece">Piece</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="pair">Pair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData({ ...formData, condition: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="needs_repair">Needs Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cost">Cost (£)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="finePerDay">Fine Per Day (£)</Label>
              <Input
                id="finePerDay"
                type="number"
                step="0.01"
                min="0"
                value={formData.finePerDay}
                onChange={(e) => setFormData({ ...formData, finePerDay: e.target.value })}
                placeholder="Fine for late returns"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTool.isPending}>
              {createTool.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Tool
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

