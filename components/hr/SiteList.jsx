'use client';

import { useState, useEffect } from 'react';
import { Trash2, Edit, MapPin, Building2, User, UserPlus, List, Map, QrCode, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CreateSiteForm from './CreateSiteForm';
import AssignSiteManagerModal from './AssignSiteManagerModal';
import EditSiteModal from './EditSiteModal';
import SitesMapView from './SitesMapView';
import SiteQRManager from './SiteQRManager';
import { useRouter } from 'next/navigation';

/**
 * SiteList Component
 * 
 * Purpose: Display all sites with ability to assign Site Managers
 * 
 * Props:
 * - initialSites: Array of sites with populated data including siteManagers
 * - allSiteManagers: Array of all available Site Managers for assignment
 */
export default function SiteList({ initialSites, allSiteManagers = [] }) {
  const router = useRouter();
  const [sites, setSites] = useState(initialSites);
  const [deletingId, setDeletingId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignModalSite, setAssignModalSite] = useState(null);
  const [editingSite, setEditingSite] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [updatingRadiusId, setUpdatingRadiusId] = useState(null);

  // Sync sites with initialSites when it changes
  useEffect(() => {
    setSites(initialSites);
  }, [initialSites]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this site?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/v1/sites/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setSites(sites.filter((site) => site._id !== id));
      } else {
        alert(result.error?.message || 'Failed to delete site');
      }
    } catch (err) {
      alert('An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      planning: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || colors.active;
  };

  const formatStatus = (status) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCreateSuccess = (newSite) => {
    setSites([newSite, ...sites]);
    setIsCreateModalOpen(false);
  };

  const handleEditSuccess = (updatedSite) => {
    setSites(sites.map(site => 
      site._id === updatedSite._id ? updatedSite : site
    ));
    setEditingSite(null);
  };

  /**
   * Open the assign Site Manager modal for a specific site
   */
  const handleOpenAssignModal = (site) => {
    setAssignModalSite(site);
  };

  /**
   * Close the assign modal and refresh data
   */
  const handleCloseAssignModal = () => {
    setAssignModalSite(null);
    // Refresh the page to get updated Site Manager assignments
    router.refresh();
  };

  /**
   * Handle successful assignment update
   */
  const handleAssignmentUpdate = () => {
    router.refresh();
  };

  /**
   * Handle radius update
   */
  const handleRadiusUpdate = async (siteId, newRadius) => {
    setUpdatingRadiusId(siteId);
    try {
      const response = await fetch(`/api/v1/sites/${siteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendanceRadius: newRadius,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setSites(sites.map(site => 
          site._id === siteId 
            ? { ...site, attendanceRadius: newRadius }
            : site
        ));
      } else {
        alert(result.error?.message || 'Failed to update radius');
      }
    } catch (err) {
      alert('An error occurred while updating radius');
    } finally {
      setUpdatingRadiusId(null);
    }
  };

  return (
    <div className="space-y-4">
      {isCreateModalOpen && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Site</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          </div>
          <CreateSiteForm 
            onSuccess={handleCreateSuccess} 
            onCancel={() => setIsCreateModalOpen(false)} 
          />
        </div>
      )}

      {!isCreateModalOpen && (
        <>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <Map className="h-4 w-4 mr-2" />
                Map View
              </Button>
            </div>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Create Site button clicked');
                setIsCreateModalOpen(true);
              }}
              type="button"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create Site
            </Button>
          </div>

          {sites.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No sites found. Create your first site to get started.</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="border rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
              <SitesMapView sites={sites} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-gray-200">
                {/* Mobile Card View */}
                <div className="block sm:hidden">
                  {sites.map((site) => (
                    <div key={site._id} className="p-4 border-b">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {site.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{site.siteCode}</p>
                        </div>
                        <div className="flex gap-2">
                          <SiteQRManager siteId={site._id} siteName={site.name} />
                          <button
                            onClick={() => setEditingSite(site)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Edit Site"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenAssignModal(site)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Assign Site Manager"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(site._id)}
                            disabled={deletingId === site._id}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {site.address.street}, {site.address.city}, {site.address.postcode}
                          </span>
                        </div>
                        {site.siteManagers && site.siteManagers.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <UserPlus className="w-3 h-3" />
                            <span>
                              SM: {site.siteManagers.map(m => `${m.firstName} ${m.lastName}`).join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(site.status)}`}>
                            {formatStatus(site.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Radius: {site.attendanceRadius || 50}m
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <table className="hidden sm:table min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Site Managers
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Radius
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sites.map((site) => (
                      <tr key={site._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {site.name}
                            </div>
                            <div className="text-xs text-gray-500">{site.siteCode}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {site.address.street}
                          </div>
                          <div className="text-xs text-gray-500">
                            {site.address.city}, {site.address.postcode}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {site.siteManagers && site.siteManagers.length > 0 ? (
                            <div className="space-y-1">
                              {site.siteManagers.map((manager) => (
                                <div key={manager._id} className="text-sm text-gray-900">
                                  {manager.firstName} {manager.lastName}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(site.status)}`}>
                            {formatStatus(site.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={site.attendanceRadius || 50}
                              onChange={(e) => handleRadiusUpdate(site._id, parseInt(e.target.value))}
                              disabled={updatingRadiusId === site._id}
                              className="text-sm border rounded px-2 py-1 disabled:opacity-50"
                              title="Attendance radius in meters"
                            >
                              <option value={20}>20m</option>
                              <option value={50}>50m</option>
                              <option value={100}>100m</option>
                            </select>
                            {updatingRadiusId === site._id && (
                              <span className="text-xs text-gray-500">Updating...</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-3">
                            <SiteQRManager siteId={site._id} siteName={site.name} />
                            <button
                              onClick={() => setEditingSite(site)}
                              className="text-green-600 hover:text-green-900"
                              title="Edit Site"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenAssignModal(site)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Assign Site Manager"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(site._id)}
                              disabled={deletingId === site._id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Delete site"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Site Modal */}
      {editingSite && (
        <EditSiteModal
          isOpen={true}
          onClose={() => setEditingSite(null)}
          site={editingSite}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Assign Site Manager Modal */}
      {assignModalSite && (
        <AssignSiteManagerModal
          siteId={assignModalSite._id}
          siteName={assignModalSite.name}
          currentManagers={assignModalSite.siteManagers || []}
          allSiteManagers={allSiteManagers}
          onClose={handleCloseAssignModal}
          onUpdate={handleAssignmentUpdate}
        />
      )}
    </div>
  );
}

