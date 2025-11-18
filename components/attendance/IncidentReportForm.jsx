'use client';

import { useState } from 'react';
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
import { Loader2, AlertTriangle, Camera, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const incidentSchema = z.object({
  type: z.enum(['incident', 'near_miss'], {
    required_error: 'Please select incident type',
  }),
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    required_error: 'Please select severity level',
  }),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be less than 2000 characters'),
  location: z.string().max(200).optional(),
  occurredAt: z.string().min(1, 'Date/time of incident is required'),
  photos: z.array(z.string().url()).max(10).optional(),
});

export default function IncidentReportForm({ siteId, onSuccess }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      type: 'incident',
      severity: 'medium',
      description: '',
      location: '',
      occurredAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      photos: [],
    },
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG and PNG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return;
    }

    if (photoUrls.length >= 10) {
      setError('Maximum 10 photos allowed');
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      // For now, we'll use a simple approach - in production, upload to S3/Cloudinary
      // This is a placeholder - you'd need to implement actual file upload
      const reader = new FileReader();
      reader.onloadend = () => {
        // In production, this would be the URL from your file upload service
        const photoUrl = reader.result; // This is a data URL - in production, use actual URL
        const newPhotos = [...photoUrls, photoUrl];
        setPhotoUrls(newPhotos);
        setValue('photos', newPhotos);
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload photo');
      setUploadingPhoto(false);
    }
  };

  const removePhoto = (index) => {
    const newPhotos = photoUrls.filter((_, i) => i !== index);
    setPhotoUrls(newPhotos);
    setValue('photos', newPhotos);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          siteId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to report incident');
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/attendance/incidents?success=true');
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to report incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          Report Incident / Near-Miss
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Incident Type */}
          <div>
            <Label htmlFor="type">Incident Type *</Label>
            <Select
              onValueChange={(value) => setValue('type', value)}
              defaultValue="incident"
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select incident type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="near_miss">Near-Miss</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Severity */}
          <div>
            <Label htmlFor="severity">Severity Level *</Label>
            <Select
              onValueChange={(value) => setValue('severity', value)}
              defaultValue="medium"
            >
              <SelectTrigger id="severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            {errors.severity && (
              <p className="mt-1 text-sm text-red-500">{errors.severity.message}</p>
            )}
          </div>

          {/* Occurred At */}
          <div>
            <Label htmlFor="occurredAt">Date & Time of Incident *</Label>
            <Input
              id="occurredAt"
              type="datetime-local"
              {...register('occurredAt')}
            />
            {errors.occurredAt && (
              <p className="mt-1 text-sm text-red-500">{errors.occurredAt.message}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location on Site (Optional)</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="e.g., Building A, Ground Floor, North Side"
            />
            {errors.location && (
              <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Provide a detailed description of what happened..."
              rows={6}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Photos */}
          <div>
            <Label className="text-sm sm:text-base">Photos (Optional, Max 10)</Label>
            <div className="mt-2">
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center w-full h-24 sm:h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary transition-colors cursor-pointer"
              >
                {uploadingPhoto ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    <p className="text-xs sm:text-sm text-muted-foreground">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 px-4">
                    <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    <p className="text-xs sm:text-sm text-muted-foreground text-center">
                      Click to upload photos
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      JPG or PNG (max 5MB each)
                    </p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={uploadingPhoto || photoUrls.length >= 10}
                />
              </label>
              {photoUrls.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {photoUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-20 sm:h-24 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 sm:p-1 touch-manipulation"
                        aria-label="Remove photo"
                      >
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Submit Incident Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

