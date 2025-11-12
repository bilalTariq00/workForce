'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Upload } from 'lucide-react';

/**
 * Delivery Item Component
 * 
 * Purpose: Individual delivery item in the daily log form
 * 
 * Features:
 * - Material description input
 * - Docket number input
 * - Photo upload (URL input for now - can be enhanced with file upload later)
 * - PO match status dropdown
 * - Remove button
 * 
 * Props:
 * - delivery: Delivery object with material, docketNumber, docketPhoto, poMatchStatus
 * - index: Index in the deliveries array
 * - onUpdate: Callback when delivery is updated
 * - onRemove: Callback when delivery is removed
 */
export default function DeliveryItem({ delivery, index, onUpdate, onRemove }) {
  const [localDelivery, setLocalDelivery] = useState(delivery);

  /**
   * Handle input changes and update parent component
   */
  const handleChange = (field, value) => {
    const updated = {
      ...localDelivery,
      [field]: value,
    };
    setLocalDelivery(updated);
    onUpdate(updated);
  };

  /**
   * Handle photo URL input
   * In a production system, this would upload to cloud storage (S3, Cloudinary, etc.)
   * and return a URL. For now, we accept direct URL input.
   */
  const handlePhotoChange = (e) => {
    const url = e.target.value;
    handleChange('docketPhoto', url);
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Header with remove button */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">
              Delivery #{index + 1}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Material Description */}
          <div>
            <label
              htmlFor={`material-${index}`}
              className="block text-sm font-medium text-foreground mb-2"
            >
              Material Description *
            </label>
            <Input
              type="text"
              id={`material-${index}`}
              value={localDelivery.material}
              onChange={(e) => handleChange('material', e.target.value)}
              placeholder="e.g., Concrete, Steel beams, Timber"
              required
              className="w-full"
            />
          </div>

          {/* Docket Number */}
          <div>
            <label
              htmlFor={`docket-${index}`}
              className="block text-sm font-medium text-foreground mb-2"
            >
              Docket Number *
            </label>
            <Input
              type="text"
              id={`docket-${index}`}
              value={localDelivery.docketNumber}
              onChange={(e) => handleChange('docketNumber', e.target.value)}
              placeholder="e.g., DOCK-12345"
              required
              className="w-full"
            />
          </div>

          {/* Docket Photo URL */}
          <div>
            <label
              htmlFor={`photo-${index}`}
              className="block text-sm font-medium text-foreground mb-2"
            >
              Docket Photo URL *
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                id={`photo-${index}`}
                value={localDelivery.docketPhoto}
                onChange={handlePhotoChange}
                placeholder="https://example.com/photo.jpg"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Upload photo (coming soon)"
                disabled
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              TODO: File upload will be implemented later. For now, paste the photo URL.
            </p>
          </div>

          {/* PO Match Status */}
          <div>
            <label
              htmlFor={`po-status-${index}`}
              className="block text-sm font-medium text-foreground mb-2"
            >
              PO Match Status
            </label>
            <Select
              value={localDelivery.poMatchStatus}
              onValueChange={(value) => handleChange('poMatchStatus', value)}
            >
              <SelectTrigger id={`po-status-${index}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Status of matching this delivery to a Purchase Order
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


