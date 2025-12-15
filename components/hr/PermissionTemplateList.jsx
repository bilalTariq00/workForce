'use client';

import { useState, useEffect } from 'react';
import { Edit, Trash2, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreatePermissionTemplateForm from './CreatePermissionTemplateForm';
import PermissionPreview from './PermissionPreview';

export default function PermissionTemplateList({ initialTemplates = [] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Sync templates with initialTemplates when it changes
  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/role-templates');
      const result = await response.json();
      if (result.success) {
        setTemplates(result.data);
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) {
      alert('Cannot delete default templates');
      return;
    }

    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/v1/role-templates/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setTemplates(templates.filter((t) => t._id !== id));
      } else {
        alert(result.error?.message || 'Failed to delete template');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setShowCreateForm(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingTemplate(null);
  };

  const handleFormSuccess = () => {
    fetchTemplates();
    handleFormClose();
  };

  const getBaseRoleColor = (baseRole) => {
    const colors = {
      labour: 'bg-blue-100 text-blue-800',
      site_manager: 'bg-green-100 text-green-800',
      contracts_manager: 'bg-purple-100 text-purple-800',
      hr_officer: 'bg-orange-100 text-orange-800',
      ehs_officer: 'bg-red-100 text-red-800',
      admin: 'bg-gray-100 text-gray-800',
    };
    return colors[baseRole] || 'bg-gray-100 text-gray-800';
  };

  const formatBaseRole = (baseRole) => {
    if (!baseRole) return 'Custom';
    return baseRole
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const countPermissions = (template) => {
    if (!template.permissions) return 0;
    return template.permissions.reduce((total, perm) => total + (perm.actions?.length || 0), 0);
  };

  if (loading && templates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Permission Templates</h2>
        <Button onClick={handleCreate} size="sm">
          Create Template
        </Button>
      </div>

      {showCreateForm && (
        <CreatePermissionTemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {previewTemplate && (
        <PermissionPreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {templates.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-lg">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No permission templates found. Create your first template to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-primary" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                            {template.isDefault && (
                              <span className="ml-2 text-xs text-gray-500">(Default)</span>
                            )}
                          </div>
                          {template.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {template.baseRole && (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBaseRoleColor(
                            template.baseRole
                          )}`}
                        >
                          {formatBaseRole(template.baseRole)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {countPermissions(template)} permission(s)
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.permissions?.length || 0} module(s)
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {template.isActive ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template._id, template.isDefault)}
                            disabled={deletingId === template._id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {templates.map((template) => (
              <div
                key={template._id}
                className="border rounded-lg p-4 space-y-3 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      <h3 className="font-semibold text-gray-900">
                        {template.name}
                        {template.isDefault && (
                          <span className="ml-2 text-xs text-gray-500">(Default)</span>
                        )}
                      </h3>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.baseRole && (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getBaseRoleColor(
                        template.baseRole
                      )}`}
                    >
                      {formatBaseRole(template.baseRole)}
                    </span>
                  )}
                  {template.isActive ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    {countPermissions(template)} permission(s) across{' '}
                    {template.permissions?.length || 0} module(s)
                  </p>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template._id, template.isDefault)}
                      disabled={deletingId === template._id}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



