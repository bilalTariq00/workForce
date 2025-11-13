'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function EditSiteModal({ isOpen, onClose, site, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      postcode: '',
      country: 'UK',
    },
    location: {
      latitude: '',
      longitude: '',
    },
    attendanceRadius: '100',
    status: 'active',
  });

  // Load site data when modal opens
  useEffect(() => {
    if (site && isOpen) {
      setFormData({
        name: site.name || '',
        address: {
          street: site.address?.street || '',
          city: site.address?.city || '',
          postcode: site.address?.postcode || '',
          country: site.address?.country || 'UK',
        },
        location: {
          latitude: site.location?.latitude?.toString() || '',
          longitude: site.location?.longitude?.toString() || '',
        },
        attendanceRadius: site.attendanceRadius?.toString() || '100',
        status: site.status || 'active',
      });
      setError('');
      setFieldErrors({});
    }
  }, [site, isOpen]);

  if (!isOpen || !site) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      // Parse location coordinates
      const latitude = parseFloat(formData.location.latitude);
      const longitude = parseFloat(formData.location.longitude);

      // Basic client-side validation
      if (isNaN(latitude) || latitude < -90 || latitude > 90) {
        setFieldErrors({
          'location.latitude': 'Latitude must be between -90 and 90',
        });
        setLoading(false);
        return;
      }

      if (isNaN(longitude) || longitude < -180 || longitude > 180) {
        setFieldErrors({
          'location.longitude': 'Longitude must be between -180 and 180',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/v1/sites/${site._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          location: {
            latitude: latitude,
            longitude: longitude,
          },
          attendanceRadius: parseFloat(formData.attendanceRadius),
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
        router.refresh();
        onClose();
      } else {
        if (result.error?.details) {
          setFieldErrors(result.error.details);
        }
        setError(result.error?.message || 'Failed to update site');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Edit Site</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Site Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Site Name *
            </label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Address</h3>
            <div>
              <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                Street *
              </label>
              <Input
                type="text"
                id="address.street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <Input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="address.postcode" className="block text-sm font-medium text-gray-700 mb-1">
                  Postcode *
                </label>
                <Input
                  type="text"
                  id="address.postcode"
                  name="address.postcode"
                  value={formData.address.postcode}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Location (GPS Coordinates) */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Location (GPS Coordinates) *</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="location.latitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude * (between -90 and 90)
                </label>
                <Input
                  type="number"
                  id="location.latitude"
                  name="location.latitude"
                  value={formData.location.latitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-90"
                  max="90"
                  className={`w-full ${fieldErrors['location.latitude'] ? 'border-red-500' : ''}`}
                  placeholder="e.g., 33.6382"
                />
                {fieldErrors['location.latitude'] && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors['location.latitude']}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Valid range: -90 to 90
                </p>
              </div>
              <div>
                <label htmlFor="location.longitude" className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude * (between -180 and 180)
                </label>
                <Input
                  type="number"
                  id="location.longitude"
                  name="location.longitude"
                  value={formData.location.longitude}
                  onChange={handleChange}
                  required
                  step="any"
                  min="-180"
                  max="180"
                  className={`w-full ${fieldErrors['location.longitude'] ? 'border-red-500' : ''}`}
                  placeholder="e.g., 73.0627"
                />
                {fieldErrors['location.longitude'] && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors['location.longitude']}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Valid range: -180 to 180
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Get coordinates from Google Maps - Right-click on location → "What's here?"
              </p>
            </div>
          </div>

          {/* Attendance Radius and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="attendanceRadius" className="block text-sm font-medium text-gray-700 mb-1">
                Attendance Radius (meters) *
              </label>
              <Input
                type="number"
                id="attendanceRadius"
                name="attendanceRadius"
                value={formData.attendanceRadius}
                onChange={handleChange}
                required
                min="10"
                max="1000"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Range: 10-1000 meters</p>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                required
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Site'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

