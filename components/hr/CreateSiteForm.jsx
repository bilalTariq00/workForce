'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// Using standard HTML labels

export default function CreateSiteForm({ onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({}); // Store field-specific errors
  const [siteManagers, setSiteManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
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
    contractsManagerId: '', // Keep for backward compatibility but make optional
    status: 'active',
    startDate: '',
    endDate: '',
  });

  /**
   * Fetch all Site Managers from the API
   * Filters for employees with role 'site_manager' and status 'active'
   * 
   * These Site Managers can be assigned to sites
   */
  const fetchSiteManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await fetch('/api/v1/employees');
      const data = await response.json();
      
      if (data.success) {
        // Filter for Site Managers only
        const sms = data.data.filter(
          emp => emp.role === 'site_manager' && emp.status === 'active'
        );
        setSiteManagers(sms);
        
        // Log for debugging
        console.log('Total employees:', data.data.length);
        console.log('Site Managers found:', sms.length);
        
        if (sms.length === 0) {
          console.warn('No active Site Managers found. Please create a Site Manager employee first.');
        }
      } else {
        console.error('Failed to fetch employees:', data.error);
      }
    } catch (err) {
      console.error('Error fetching site managers:', err);
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    fetchSiteManagers();
  }, []);

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

  /**
   * Handle form submission
   * Validates data and creates the site
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({}); // Clear previous field errors
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

      const response = await fetch('/api/v1/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          location: {
            latitude: latitude,
            longitude: longitude,
          },
          attendanceRadius: parseFloat(formData.attendanceRadius),
          startDate: formData.startDate || undefined,
          endDate: formData.endDate || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        // Handle validation errors from API
        if (result.error?.code === 'VALIDATION_ERROR' && result.error?.details) {
          // Parse field errors from API response
          const errors = {};
          result.error.details.forEach((detail) => {
            // Convert path array to string (e.g., ['location', 'latitude'] -> 'location.latitude')
            const fieldPath = detail.path.join('.');
            errors[fieldPath] = detail.message || `Invalid ${fieldPath}`;
          });
          setFieldErrors(errors);
          setError('Please fix the errors below');
        } else {
          setError(result.error?.message || 'Failed to create site');
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error creating site:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Show validation errors summary if there are field errors */}
      {Object.keys(fieldErrors).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(fieldErrors).map(([field, message]) => (
              <li key={field}>
                <strong>{field.replace(/\./g, ' ')}:</strong> {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Site Name *</label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full mt-1"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Address</h3>
        <div>
          <label htmlFor="address.street" className="block text-sm font-medium text-foreground mb-2">Street *</label>
          <Input
            type="text"
            id="address.street"
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            required
            className="w-full mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-foreground mb-2">City *</label>
            <Input
              type="text"
              id="address.city"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              required
              className="w-full mt-1"
            />
          </div>
          <div>
            <label htmlFor="address.postcode" className="block text-sm font-medium text-foreground mb-2">Postcode *</label>
            <Input
              type="text"
              id="address.postcode"
              name="address.postcode"
              value={formData.address.postcode}
              onChange={handleChange}
              required
              className="w-full mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Location (GPS Coordinates)</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location.latitude" className="block text-sm font-medium text-foreground mb-2">
              Latitude * (between -90 and 90)
            </label>
            <Input
              type="number"
              id="location.latitude"
              name="location.latitude"
              value={formData.location.latitude}
              onChange={(e) => {
                handleChange(e);
                // Clear error when user starts typing
                if (fieldErrors['location.latitude']) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors['location.latitude'];
                    return newErrors;
                  });
                }
              }}
              required
              step="any"
              min="-90"
              max="90"
              className={`w-full mt-1 ${fieldErrors['location.latitude'] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g., 51.5074"
            />
            {fieldErrors['location.latitude'] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors['location.latitude']}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Valid range: -90 to 90 (e.g., 51.5074 for London)
            </p>
          </div>
          <div>
            <label htmlFor="location.longitude" className="block text-sm font-medium text-foreground mb-2">
              Longitude * (between -180 and 180)
            </label>
            <Input
              type="number"
              id="location.longitude"
              name="location.longitude"
              value={formData.location.longitude}
              onChange={(e) => {
                handleChange(e);
                // Clear error when user starts typing
                if (fieldErrors['location.longitude']) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors['location.longitude'];
                    return newErrors;
                  });
                }
              }}
              required
              step="any"
              min="-180"
              max="180"
              className={`w-full mt-1 ${fieldErrors['location.longitude'] ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="e.g., -0.1278"
            />
            {fieldErrors['location.longitude'] && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors['location.longitude']}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Valid range: -180 to 180 (e.g., -0.1278 for London)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="attendanceRadius" className="block text-sm font-medium text-foreground mb-2">Attendance Radius (meters) *</label>
          <Input
            type="number"
            id="attendanceRadius"
            name="attendanceRadius"
            value={formData.attendanceRadius}
            onChange={handleChange}
            required
            min="10"
            max="1000"
            className="w-full mt-1"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="siteManagerId" className="block text-sm font-medium text-foreground">
              Site Manager *
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchSiteManagers}
              disabled={loadingManagers}
              className="text-xs h-7"
            >
              {loadingManagers ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          {loadingManagers ? (
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm mt-1">
              Loading Site Managers...
            </div>
          ) : siteManagers.length === 0 ? (
            <div className="mt-1">
              <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 text-yellow-800 text-sm">
                <p className="font-medium mb-1">⚠️ No Site Managers found</p>
                <p className="text-xs mb-2">
                  You need to create a <strong>Site Manager</strong> employee first.
                </p>
                <p className="text-xs">
                  Go to "Create Employee" → Select role "Site Manager" → Create the employee.
                </p>
              </div>
            </div>
          ) : (
            <Select
              value={formData.contractsManagerId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, contractsManagerId: value }))}
              required
            >
              <SelectTrigger id="siteManagerId" className="w-full mt-1">
                <SelectValue placeholder="Select a site manager" />
              </SelectTrigger>
              <SelectContent>
                {siteManagers.map((sm) => (
                  <SelectItem key={sm._id} value={sm._id}>
                    {sm.firstName} {sm.lastName} {sm.email ? `(${sm.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">Status *</label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
            required
          >
            <SelectTrigger id="status" className="w-full mt-1">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">Start Date</label>
          <Input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full mt-1"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-2">End Date</label>
          <Input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full mt-1"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 sm:flex-initial"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 sm:flex-initial"
        >
          {loading ? 'Creating...' : 'Create Site'}
        </Button>
      </div>
    </form>
  );
}

