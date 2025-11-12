'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, UserPlus, UserMinus } from 'lucide-react';

/**
 * Assign Site Manager Modal Component
 * 
 * Purpose: Allows HR to assign/unassign Site Managers to/from a site
 * 
 * Props:
 * - siteId: ID of the site
 * - siteName: Name of the site (for display)
 * - currentManagers: Array of currently assigned Site Managers
 * - allSiteManagers: Array of all available Site Managers
 * - onClose: Callback when modal is closed
 * - onUpdate: Callback when assignment is updated (refreshes the list)
 */
export default function AssignSiteManagerModal({
  siteId,
  siteName,
  currentManagers,
  allSiteManagers,
  onClose,
  onUpdate,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get Site Managers not currently assigned to this site
  const availableManagers = allSiteManagers.filter(
    (manager) => !currentManagers.some((cm) => cm._id === manager._id)
  );

  /**
   * Assign a Site Manager to this site
   */
  const handleAssign = async (managerId) => {
    if (!managerId) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/employees/${managerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: siteId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Site Manager assigned successfully');
        // Refresh the list
        if (onUpdate) {
          setTimeout(() => {
            onUpdate();
            onClose();
          }, 1000);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setError(result.error?.message || 'Failed to assign Site Manager');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Unassign a Site Manager from this site
   */
  const handleUnassign = async (managerId) => {
    if (!confirm('Are you sure you want to unassign this Site Manager from this site?')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/v1/employees/${managerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: null, // Remove site assignment
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Site Manager unassigned successfully');
        // Refresh the list
        if (onUpdate) {
          setTimeout(() => {
            onUpdate();
            onClose();
          }, 1000);
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        setError(result.error?.message || 'Failed to unassign Site Manager');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Assign Site Managers</h2>
            <p className="text-sm text-gray-500 mt-1">{siteName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Currently Assigned Site Managers */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Currently Assigned Site Managers ({currentManagers.length})
            </h3>
            {currentManagers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No Site Managers assigned</p>
            ) : (
              <div className="space-y-2">
                {currentManagers.map((manager) => (
                  <div
                    key={manager._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {manager.firstName} {manager.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{manager.email}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassign(manager._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Unassign
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign New Site Manager */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Assign New Site Manager</h3>
            {availableManagers.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                All Site Managers are already assigned to sites
              </p>
            ) : (
              <div className="space-y-3">
                <Select
                  onValueChange={(value) => handleAssign(value)}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a Site Manager to assign" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableManagers.map((manager) => (
                      <SelectItem key={manager._id} value={manager._id}>
                        {manager.firstName} {manager.lastName} ({manager.email})
                        {manager.siteId && (
                          <span className="text-xs text-gray-400 ml-2">
                            (Currently assigned to another site)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Selecting a Site Manager will assign them to this site. If they're assigned to
                  another site, they'll be moved to this site.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}


