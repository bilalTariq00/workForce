'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Edit, Trash2, Shield, CheckCircle2, XCircle, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminRoleTemplateForm from './AdminRoleTemplateForm';
import PermissionPreview from '@/components/hr/PermissionPreview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminRoleTemplateManager({ initialTemplates = [] }) {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState(initialTemplates);
  const [loading, setLoading] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const isAdmin = session?.user?.role === 'admin';

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
    const message = isDefault
      ? 'Are you sure you want to delete this DEFAULT template? This is a destructive action that cannot be undone. Only admins can delete default templates.'
      : 'Are you sure you want to delete this template? This action cannot be undone.';
    
    if (!confirm(message)) {
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

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || template.baseRole === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.isActive) ||
      (filterStatus === 'inactive' && !template.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Group templates by base role
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const role = template.baseRole || 'custom';
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(template);
    return acc;
  }, {});

  const roleOrder = ['labour', 'site_manager', 'contracts_manager', 'hr_officer', 'ehs_officer', 'admin', 'custom'];

  if (loading && templates.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Role Templates</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTemplates.length} of {templates.length} templates
          </p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="labour">Labour</SelectItem>
            <SelectItem value="site_manager">Site Manager</SelectItem>
            <SelectItem value="contracts_manager">Contracts Manager</SelectItem>
            <SelectItem value="hr_officer">HR Officer</SelectItem>
            <SelectItem value="ehs_officer">EHS Officer</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <AdminRoleTemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Preview Dialog */}
      {previewTemplate && (
        <PermissionPreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}

      {/* Templates List - Grouped by Role */}
      {filteredTemplates.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-lg">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No templates found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {roleOrder.map((role) => {
            if (!groupedTemplates[role] || groupedTemplates[role].length === 0) return null;

            return (
              <Card key={role}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatBaseRole(role)} Templates ({groupedTemplates[role].length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {groupedTemplates[role].map((template) => (
                      <div
                        key={template._id}
                        className="border rounded-lg p-4 space-y-3 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Shield className="h-4 w-4 text-primary" />
                              <h3 className="font-semibold text-gray-900">
                                {template.name}
                                {template.isDefault && (
                                  <span className="ml-2 text-xs text-gray-500 font-normal">
                                    (Default - Admin can edit)
                                  </span>
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
                          {template.isDefault && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Default Template
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
                          {/* Only admins can delete default templates */}
                          {(isAdmin || !template.isDefault) && (
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

