'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Upload, Camera, X, Check, XCircle, AlertTriangle, Download, Trash2 } from 'lucide-react';

export default function EmployeeCertificatesTab({ employeeId }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    certificateNumber: '',
    issueDate: '',
    expiryDate: '',
    notes: '',
    uploadMethod: 'file',
    file: null,
    preview: null,
  });

  // Date formatting functions (must be in Client Component)
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateShort = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-GB');
  };

  // Fetch certificates
  useEffect(() => {
    fetchCertificates();
  }, [employeeId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/employees/${employeeId}/certificates`);
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
        preview: URL.createObjectURL(file),
      }));
    }
  };

  const handleCameraCapture = () => {
    // Create a file input that accepts camera capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setFormData((prev) => ({
          ...prev,
          file,
          uploadMethod: 'camera',
          preview: URL.createObjectURL(file),
        }));
      }
    };
    input.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      if (!formData.file) {
        setError('Please select a file');
        setUploading(false);
        return;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', formData.file);
      uploadFormData.append('type', formData.type);
      uploadFormData.append('issueDate', formData.issueDate);
      uploadFormData.append('expiryDate', formData.expiryDate);
      uploadFormData.append('uploadMethod', formData.uploadMethod);
      if (formData.certificateNumber) uploadFormData.append('certificateNumber', formData.certificateNumber);
      if (formData.notes) uploadFormData.append('notes', formData.notes);

      const response = await fetch(`/api/v1/employees/${employeeId}/certificates`, {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setFormData({
          type: '',
          certificateNumber: '',
          issueDate: '',
          expiryDate: '',
          notes: '',
          uploadMethod: 'file',
          file: null,
          preview: null,
        });
        // Close form and refresh certificates list
        setShowUploadForm(false);
        await fetchCertificates();
      } else {
        setError(result.error?.message || 'Failed to upload certificate');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (certId, action) => {
    try {
      const response = await fetch(`/api/v1/employees/${employeeId}/certificates/${certId}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? 'Please provide a reason' : undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchCertificates();
      } else {
        alert(result.error?.message || 'Failed to validate certificate');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const handleDelete = async (certId) => {
    if (!confirm('Are you sure you want to delete this certificate?')) return;

    try {
      const response = await fetch(`/api/v1/employees/${employeeId}/certificates/${certId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        fetchCertificates();
      } else {
        alert(result.error?.message || 'Failed to delete certificate');
      }
    } catch (err) {
      alert('An error occurred');
    }
  };

  const getStatusBadge = (status, expiryDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (status === 'valid' && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon ({daysUntilExpiry}d)</Badge>;
    }
    if (status === 'expired' || expiry < today) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (status === 'pending_validation') {
      return <Badge className="bg-gray-100 text-gray-800">Pending Validation</Badge>;
    }
    if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-gray-500">Loading certificates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Certificate
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowUploadForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Certificate Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SafePass">SafePass</SelectItem>
                      <SelectItem value="CSCS">CSCS</SelectItem>
                      <SelectItem value="FirstAid">First Aid</SelectItem>
                      <SelectItem value="Forklift">Forklift</SelectItem>
                      <SelectItem value="CPCS">CPCS</SelectItem>
                      <SelectItem value="IPAF">IPAF</SelectItem>
                      <SelectItem value="PASMA">PASMA</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Certificate Number
                  </label>
                  <Input
                    type="text"
                    value={formData.certificateNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, certificateNumber: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Issue Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issueDate: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expiry Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Method
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.uploadMethod === 'file' ? 'default' : 'outline'}
                    onClick={() => setFormData((prev) => ({ ...prev, uploadMethod: 'file' }))}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    File Upload
                  </Button>
                  <Button
                    type="button"
                    variant={formData.uploadMethod === 'camera' ? 'default' : 'outline'}
                    onClick={handleCameraCapture}
                    className="flex-1"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Document *
                </label>
                {formData.preview ? (
                  <div className="space-y-2">
                    <img
                      src={formData.preview}
                      alt="Preview"
                      className="max-w-full h-48 object-contain border rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData((prev) => ({ ...prev, file: null, preview: null }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <Input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload Certificate'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificates ({certificates.length})
            </CardTitle>
            <Button onClick={() => setShowUploadForm(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Certificate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No certificates uploaded</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowUploadForm(true)}
              >
                Upload First Certificate
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert._id}
                  className={`p-4 border rounded-lg ${
                    cert.status === 'expired' ? 'border-red-200 bg-red-50' :
                    cert.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50' :
                    cert.status === 'valid' ? 'border-green-200 bg-green-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{cert.type}</h3>
                        {getStatusBadge(cert.status, cert.expiryDate)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {cert.certificateNumber && (
                          <div>
                            <p className="text-xs text-muted-foreground">Certificate Number</p>
                            <p className="font-medium">{cert.certificateNumber}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Issue Date</p>
                          <p className="font-medium">{formatDateShort(cert.issueDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Expiry Date</p>
                          <p className="font-medium">{formatDateShort(cert.expiryDate)}</p>
                        </div>
                        {cert.validatedBy && (
                          <div>
                            <p className="text-xs text-muted-foreground">Validated By</p>
                            <p className="font-medium">
                              {typeof cert.validatedBy === 'object'
                                ? `${cert.validatedBy.firstName} ${cert.validatedBy.lastName}`
                                : 'N/A'}
                            </p>
                          </div>
                        )}
                      </div>
                      {cert.notes && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm">{cert.notes}</p>
                        </div>
                      )}
                      {cert.rejectionReason && (
                        <div className="mt-2">
                          <p className="text-xs text-red-600 font-medium">Rejection Reason</p>
                          <p className="text-sm text-red-600">{cert.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      {cert.status === 'pending_validation' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidate(cert._id, 'approve')}
                            className="text-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidate(cert._id, 'reject')}
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(cert._id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

