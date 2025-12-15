'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PermissionMatrix from '@/components/hr/PermissionMatrix';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

export default function AdminRoleTemplateForm({
  template = null,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseRole: '',
    isDefault: false,
    isActive: true,
    permissions: [],
  });

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        baseRole: template.baseRole || '',
        isDefault: template.isDefault || false,
        isActive: template.isActive !== undefined ? template.isActive : true,
        permissions: template.permissions || [],
      });
    }
  }, [template]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate permissions
      if (!formData.permissions || formData.permissions.length === 0) {
        setError('Please select at least one permission');
        setLoading(false);
        return;
      }

      const url = template
        ? `/api/v1/role-templates/${template._id}`
        : '/api/v1/role-templates';
      const method = template ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(result.error?.message || 'An error occurred');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error saving template:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionsChange = (permissions) => {
    setFormData({
      ...formData,
      permissions,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Role Template (Admin)' : 'Create Role Template'}
          </DialogTitle>
        </DialogHeader>

        {/* Admin Warning for Default Templates */}
        {template?.isDefault && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Editing Default Template</p>
              <p className="text-xs mt-1">
                You are editing a default template. Changes will affect all users assigned to this template.
                As an admin, you have full access to modify default templates.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Site Manager - Custom"
                  required
                />
                {template?.isDefault && (
                  <p className="text-xs text-amber-600 mt-1">
                    Admin: Default template name can be modified
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the purpose of this template..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Base Role
                  </label>
                  <Select
                    value={formData.baseRole || 'none'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, baseRole: value === 'none' ? '' : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base role (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Custom)</SelectItem>
                      <SelectItem value="labour">Labour</SelectItem>
                      <SelectItem value="site_manager">Site Manager</SelectItem>
                      <SelectItem value="contracts_manager">
                        Contracts Manager
                      </SelectItem>
                      <SelectItem value="hr_officer">HR Officer</SelectItem>
                      <SelectItem value="ehs_officer">EHS Officer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Status
                  </label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onValueChange={(value) =>
                      setFormData({ ...formData, isActive: value === 'active' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!template?.isDefault && (
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isDefault: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isDefault" className="text-sm font-medium">
                    Mark as default template
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permission Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <p className="text-sm text-gray-500">
                Select modules and actions to grant permissions. Changes apply immediately to all users with this template.
              </p>
            </CardHeader>
            <CardContent>
              <PermissionMatrix
                permissions={formData.permissions}
                onChange={handlePermissionsChange}
              />
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

