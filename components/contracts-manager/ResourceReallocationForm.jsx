'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save, Users, Truck, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const reallocationSchema = z.object({
  fromSiteId: z.string().min(1, 'Source site is required'),
  toSiteId: z.string().min(1, 'Destination site is required'),
  resourceType: z.enum(['crew', 'plant', 'equipment'], {
    required_error: 'Please select a resource type',
  }),
  employeeIds: z.array(z.string()).optional(),
  plantDetails: z
    .object({
      name: z.string().optional(),
      type: z.string().optional(),
      registrationNumber: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  reason: z.string().min(1, 'Reason is required').max(1000, 'Reason must be less than 1000 characters'),
}).refine((data) => {
  if (data.resourceType === 'crew') {
    return data.employeeIds && data.employeeIds.length > 0;
  }
  return true;
}, {
  message: 'At least one employee must be selected for crew reallocation',
  path: ['employeeIds'],
}).refine((data) => {
  if (data.resourceType === 'plant' || data.resourceType === 'equipment') {
    return data.plantDetails?.name && data.plantDetails.name.length > 0;
  }
  return true;
}, {
  message: 'Plant/equipment name is required',
  path: ['plantDetails'],
}).refine((data) => {
  return data.fromSiteId !== data.toSiteId;
}, {
  message: 'Source and destination sites must be different',
  path: ['toSiteId'],
});

export default function ResourceReallocationForm({ onSuccess }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedFromSite, setSelectedFromSite] = useState(null);
  const [loadingSites, setLoadingSites] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(reallocationSchema),
    defaultValues: {
      resourceType: 'crew',
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      reason: '',
    },
  });

  const resourceType = watch('resourceType');
  const fromSiteId = watch('fromSiteId');
  const selectedEmployeeIds = watch('employeeIds') || [];

  // Fetch sites
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('/api/v1/sites');
        const result = await response.json();
        if (result.success) {
          setSites(result.data);
        }
      } catch (err) {
        console.error('Error fetching sites:', err);
      } finally {
        setLoadingSites(false);
      }
    };
    fetchSites();
  }, []);

  // Fetch employees when fromSiteId changes
  useEffect(() => {
    if (fromSiteId && resourceType === 'crew') {
      const fetchEmployees = async () => {
        try {
          const response = await fetch(`/api/v1/employees?siteId=${fromSiteId}`);
          const result = await response.json();
          if (result.success) {
            // Filter to only active labour employees
            const labourEmployees = result.data.filter(
              (emp) => emp.role === 'labour' && emp.status === 'active'
            );
            setEmployees(labourEmployees);
          }
        } catch (err) {
          console.error('Error fetching employees:', err);
        }
      };
      fetchEmployees();
    } else {
      setEmployees([]);
    }
  }, [fromSiteId, resourceType]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/resource-reallocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create resource reallocation');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/contracts-manager/resource-allocation?success=true');
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to create resource reallocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEmployee = (employeeId) => {
    const current = selectedEmployeeIds;
    if (current.includes(employeeId)) {
      setValue(
        'employeeIds',
        current.filter((id) => id !== employeeId)
      );
    } else {
      setValue('employeeIds', [...current, employeeId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Resource Re-Allocation Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Resource Type */}
          <div>
            <Label htmlFor="resourceType">Resource Type *</Label>
            <Select
              onValueChange={(value) => {
                setValue('resourceType', value);
                setValue('employeeIds', []);
                setValue('plantDetails', undefined);
              }}
              defaultValue="crew"
            >
              <SelectTrigger id="resourceType">
                <SelectValue placeholder="Select resource type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crew">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Crew
                  </div>
                </SelectItem>
                <SelectItem value="plant">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Plant
                  </div>
                </SelectItem>
                <SelectItem value="equipment">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Equipment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.resourceType && (
              <p className="mt-1 text-sm text-red-500">{errors.resourceType.message}</p>
            )}
          </div>

          {/* Source Site */}
          <div>
            <Label htmlFor="fromSiteId">From Site *</Label>
            <Select
              onValueChange={(value) => {
                setValue('fromSiteId', value);
                setValue('employeeIds', []);
              }}
            >
              <SelectTrigger id="fromSiteId">
                <SelectValue placeholder="Select source site" />
              </SelectTrigger>
              <SelectContent>
                {loadingSites ? (
                  <SelectItem value="loading" disabled>Loading sites...</SelectItem>
                ) : (
                  sites.map((site) => (
                    <SelectItem key={site._id} value={site._id}>
                      {site.name} ({site.siteCode})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.fromSiteId && (
              <p className="mt-1 text-sm text-red-500">{errors.fromSiteId.message}</p>
            )}
          </div>

          {/* Destination Site */}
          <div>
            <Label htmlFor="toSiteId">To Site *</Label>
            <Select onValueChange={(value) => setValue('toSiteId', value)}>
              <SelectTrigger id="toSiteId">
                <SelectValue placeholder="Select destination site" />
              </SelectTrigger>
              <SelectContent>
                {loadingSites ? (
                  <SelectItem value="loading" disabled>Loading sites...</SelectItem>
                ) : (
                  sites
                    .filter((site) => site._id !== fromSiteId)
                    .map((site) => (
                      <SelectItem key={site._id} value={site._id}>
                        {site.name} ({site.siteCode})
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
            {errors.toSiteId && (
              <p className="mt-1 text-sm text-red-500">{errors.toSiteId.message}</p>
            )}
          </div>

          {/* Crew Selection */}
          {resourceType === 'crew' && fromSiteId && (
            <div>
              <Label>Select Employees *</Label>
              <div className="mt-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                {employees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active labour employees found for this site
                  </p>
                ) : (
                  <div className="space-y-2">
                    {employees.map((employee) => (
                      <label
                        key={employee._id}
                        className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeeIds.includes(employee._id)}
                          onChange={() => toggleEmployee(employee._id)}
                          className="rounded"
                        />
                        <span className="text-sm">
                          {employee.firstName} {employee.lastName} ({employee.employeeId})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {errors.employeeIds && (
                <p className="mt-1 text-sm text-red-500">{errors.employeeIds.message}</p>
              )}
            </div>
          )}

          {/* Plant/Equipment Details */}
          {(resourceType === 'plant' || resourceType === 'equipment') && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plantName">Name *</Label>
                <Input
                  id="plantName"
                  {...register('plantDetails.name')}
                  placeholder="e.g., Excavator 001"
                />
                {errors.plantDetails?.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.plantDetails.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="plantType">Type</Label>
                <Input
                  id="plantType"
                  {...register('plantDetails.type')}
                  placeholder="e.g., Excavator, Crane, etc."
                />
              </div>
              <div>
                <Label htmlFor="plantReg">Registration Number</Label>
                <Input
                  id="plantReg"
                  {...register('plantDetails.registrationNumber')}
                  placeholder="e.g., REG-12345"
                />
              </div>
              <div>
                <Label htmlFor="plantDesc">Description</Label>
                <Textarea
                  id="plantDesc"
                  {...register('plantDetails.description')}
                  placeholder="Additional details about the plant/equipment..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Effective Date */}
          <div>
            <Label htmlFor="effectiveDate">Effective Date *</Label>
            <Input
              id="effectiveDate"
              type="date"
              {...register('effectiveDate')}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.effectiveDate && (
              <p className="mt-1 text-sm text-red-500">{errors.effectiveDate.message}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Reallocation *</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Explain why resources need to be reallocated..."
              rows={4}
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-500">{errors.reason.message}</p>
            )}
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

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Reallocation Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

