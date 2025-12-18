'use client';

import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MODULES = [
  { code: 'hrm', name: 'HR Management' },
  { code: 'registers', name: 'Registers' },
  { code: 'process_management', name: 'Process Management' },
  { code: 'finance_payroll', name: 'Finance & Payroll' },
  { code: 'equipment', name: 'Equipment' },
  { code: 'procurement', name: 'Procurement' },
  { code: 'attendance', name: 'Attendance' },
  { code: 'certifications', name: 'Certifications' },
  { code: 'timesheets', name: 'Timesheets' },
  { code: 'leave_requests', name: 'Leave Requests' },
  { code: 'sites', name: 'Sites' },
  { code: 'reports', name: 'Reports' },
];

const ACTIONS = [
  { code: 'view', name: 'View', description: 'View records' },
  { code: 'create', name: 'Create', description: 'Create new records' },
  { code: 'edit', name: 'Edit', description: 'Edit existing records' },
  { code: 'delete', name: 'Delete', description: 'Delete records' },
  { code: 'approve', name: 'Approve', description: 'Approve requests' },
  { code: 'export', name: 'Export', description: 'Export data' },
  { code: 'manage', name: 'Manage', description: 'Full management access' },
];

export default function PermissionMatrix({ permissions = [], onChange }) {
  const [matrix, setMatrix] = useState({});

  // Initialize matrix from permissions prop
  useEffect(() => {
    const initialMatrix = {};
    MODULES.forEach((module) => {
      initialMatrix[module.code] = {};
      ACTIONS.forEach((action) => {
        const permission = permissions.find((p) => p.module === module.code);
        initialMatrix[module.code][action.code] =
          permission?.actions?.includes(action.code) || false;
      });
    });
    setMatrix(initialMatrix);
  }, [permissions]);

  const handleToggle = (module, action) => {
    const newMatrix = {
      ...matrix,
      [module]: {
        ...matrix[module],
        [action]: !matrix[module]?.[action],
      },
    };
    setMatrix(newMatrix);

    // Convert matrix to permissions array format
    const newPermissions = MODULES.map((mod) => {
      const actions = ACTIONS.filter(
        (act) => newMatrix[mod.code]?.[act.code]
      ).map((act) => act.code);

      return {
        module: mod.code,
        actions,
      };
    }).filter((perm) => perm.actions.length > 0);

    if (onChange) {
      onChange(newPermissions);
    }
  };

  const handleModuleToggle = (module, checked) => {
    const newMatrix = {
      ...matrix,
      [module]: {},
    };
    if (checked) {
      ACTIONS.forEach((action) => {
        newMatrix[module][action.code] = true;
      });
    }
    setMatrix(newMatrix);

    // Convert matrix to permissions array format
    const newPermissions = MODULES.map((mod) => {
      const actions = ACTIONS.filter(
        (act) => newMatrix[mod.code]?.[act.code]
      ).map((act) => act.code);

      return {
        module: mod.code,
        actions,
      };
    }).filter((perm) => perm.actions.length > 0);

    if (onChange) {
      onChange(newPermissions);
    }
  };

  const getModuleChecked = (module) => {
    return ACTIONS.every((action) => matrix[module]?.[action.code]);
  };

  const getModuleIndeterminate = (module) => {
    const checked = ACTIONS.filter((action) => matrix[module]?.[action.code]).length;
    return checked > 0 && checked < ACTIONS.length;
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2 font-semibold text-sm sticky left-0 bg-white z-10 min-w-[200px]">
                Module
              </th>
              {ACTIONS.map((action) => (
                <th
                  key={action.code}
                  className="text-center p-2 font-semibold text-sm min-w-[100px]"
                  title={action.description}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs">{action.name}</span>
                    <span className="text-xs text-gray-500 font-normal">
                      {action.description}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) => {
              const moduleChecked = getModuleChecked(module.code);
              const moduleIndeterminate = getModuleIndeterminate(module.code);

              return (
                <tr key={module.code} className="border-b hover:bg-gray-50">
                  <td className="p-2 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={moduleChecked}
                        onCheckedChange={(checked) =>
                          handleModuleToggle(module.code, checked)
                        }
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = moduleIndeterminate;
                          }
                        }}
                      />
                      <span className="text-sm font-medium">{module.name}</span>
                    </div>
                  </td>
                  {ACTIONS.map((action) => (
                    <td key={action.code} className="p-2 text-center">
                      <Checkbox
                        checked={matrix[module.code]?.[action.code] || false}
                        onCheckedChange={() =>
                          handleToggle(module.code, action.code)
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>
          • Select modules and actions to grant permissions
          <br />• "Manage" grants full access to a module
          <br />• Uncheck all actions to remove module access
        </p>
      </div>
    </div>
  );
}





