'use client';

import { X, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MODULE_NAMES = {
  hrm: 'HR Management',
  registers: 'Registers',
  process_management: 'Process Management',
  finance_payroll: 'Finance & Payroll',
  equipment: 'Equipment',
  procurement: 'Procurement',
  attendance: 'Attendance',
  certifications: 'Certifications',
  timesheets: 'Timesheets',
  leave_requests: 'Leave Requests',
  sites: 'Sites',
  reports: 'Reports',
};

const ACTION_NAMES = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  manage: 'Manage',
};

export default function PermissionPreview({ template, onClose }) {
  if (!template) return null;

  const formatBaseRole = (baseRole) => {
    if (!baseRole) return 'Custom';
    return baseRole
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const countPermissions = () => {
    if (!template.permissions) return 0;
    return template.permissions.reduce(
      (total, perm) => total + (perm.actions?.length || 0),
      0
    );
  };

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permission Preview: {template.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm">{template.name}</p>
                </div>
                {template.baseRole && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Base Role</p>
                    <p className="text-sm">{formatBaseRole(template.baseRole)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="text-sm">
                    {template.isActive ? (
                      <span className="inline-flex items-center text-green-600">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </p>
                </div>
                {template.isDefault && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Type</p>
                    <p className="text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                        Default Template
                      </span>
                    </p>
                  </div>
                )}
              </div>
              {template.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{template.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Permissions Summary ({countPermissions()} total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!template.permissions || template.permissions.length === 0 ? (
                <p className="text-sm text-gray-500">No permissions assigned</p>
              ) : (
                <div className="space-y-3">
                  {template.permissions.map((permission, idx) => (
                    <div
                      key={idx}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm">
                          {MODULE_NAMES[permission.module] || permission.module}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {permission.actions?.length || 0} action(s)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {permission.actions?.map((action) => (
                          <span
                            key={action}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                          >
                            {ACTION_NAMES[action] || action}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}



