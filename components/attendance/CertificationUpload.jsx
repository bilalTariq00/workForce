'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, CheckCircle2, XCircle, FileText } from 'lucide-react';

const certificationSchema = z.object({
  type: z.enum(['SafePass', 'CSCS', 'FirstAid', 'Forklift', 'Other'], {
    required_error: 'Please select a certification type',
  }),
  issueDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  notes: z.string().max(1000).optional(),
}).refine((data) => {
  const issueDate = new Date(data.issueDate);
  const expiryDate = new Date(data.expiryDate);
  return expiryDate > issueDate;
}, {
  message: 'Expiry date must be after issue date',
  path: ['expiryDate'],
});

export default function CertificationUpload({ employeeId }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      type: 'SafePass',
      issueDate: '',
      expiryDate: '',
      notes: '',
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, and PNG files are allowed');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('File size exceeds 5MB limit');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/certifications/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to upload file');
      }

      setFileUrl(result.data.documentUrl);
      setFileType(result.data.documentType);
    } catch (err) {
      setError(err.message || 'Failed to upload file');
      setSelectedFile(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const onSubmit = async (data) => {
    if (!fileUrl) {
      setError('Please upload a certification document');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          documentUrl: fileUrl,
          documentType: fileType,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to upload certification');
      }

      // Success - redirect to certifications list or show success message
      router.push('/attendance/certifications?success=true');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to upload certification');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Certification</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* File Upload */}
          <div>
            <Label htmlFor="file">Certification Document *</Label>
            <div className="mt-2">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="file-upload"
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary transition-colors">
                    {uploadingFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : fileUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-sm text-muted-foreground">File uploaded successfully</p>
                        <p className="text-xs text-muted-foreground">{selectedFile?.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, JPG, or PNG (max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploadingFile || !!fileUrl}
                  />
                </label>
              </div>
              {selectedFile && !fileUrl && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Certification Type */}
          <div>
            <Label htmlFor="type">Certification Type *</Label>
            <Select
              onValueChange={(value) => setValue('type', value)}
              defaultValue="SafePass"
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select certification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SafePass">SafePass</SelectItem>
                <SelectItem value="CSCS">CSCS</SelectItem>
                <SelectItem value="FirstAid">First Aid</SelectItem>
                <SelectItem value="Forklift">Forklift</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          {/* Issue Date */}
          <div>
            <Label htmlFor="issueDate">Issue Date *</Label>
            <Input
              id="issueDate"
              type="date"
              {...register('issueDate')}
            />
            {errors.issueDate && (
              <p className="mt-1 text-sm text-red-500">{errors.issueDate.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <Label htmlFor="expiryDate">Expiry Date *</Label>
            <Input
              id="expiryDate"
              type="date"
              {...register('expiryDate')}
            />
            {errors.expiryDate && (
              <p className="mt-1 text-sm text-red-500">{errors.expiryDate.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional information about this certification..."
              rows={3}
            />
            {errors.notes && (
              <p className="mt-1 text-sm text-red-500">{errors.notes.message}</p>
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
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !fileUrl}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Submit Certification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

