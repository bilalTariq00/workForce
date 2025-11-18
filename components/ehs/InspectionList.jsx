'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { FileText, Plus, Eye, Filter, AlertTriangle } from 'lucide-react';
import InspectionForm from './InspectionForm';
import InspectionDetail from './InspectionDetail';

export default function InspectionList({ sites }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchInspections();
  }, [filterSite, filterStatus, filterType]);

  const fetchInspections = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterSite !== 'all') params.append('siteId', filterSite);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/v1/inspections?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch inspections');
      }

      setInspections(result.data);
    } catch (err) {
      console.error('Error fetching inspections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchInspections();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">
            Draft
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      safety: 'bg-red-500',
      environmental: 'bg-green-500',
      compliance: 'bg-blue-500',
      general: 'bg-gray-500',
    };
    return (
      <Badge className={`${colors[type] || 'bg-gray-500'} text-white capitalize`}>
        {type}
      </Badge>
    );
  };

  const getOpenIssuesCount = (inspection) => {
    if (!inspection.issues) return 0;
    return inspection.issues.filter(
      (issue) => issue.status === 'open' || issue.status === 'in_progress'
    ).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading inspections...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchInspections} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">
              All Inspections ({inspections.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Inspection
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites.map((site) => (
                  <SelectItem key={site._id} value={site._id}>
                    {site.name} ({site.siteCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="safety">Safety</SelectItem>
                <SelectItem value="environmental">Environmental</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inspections List */}
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No inspections found</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create First Inspection
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {inspections.map((inspection) => {
                const openIssues = getOpenIssuesCount(inspection);
                return (
                  <div
                    key={inspection._id}
                    className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                            {inspection.title}
                          </h3>
                          {getTypeBadge(inspection.type)}
                          {getStatusBadge(inspection.status)}
                        </div>
                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                          <p>
                            <strong>Site:</strong> {inspection.siteId?.name} (
                            {inspection.siteId?.siteCode})
                          </p>
                          <p>
                            <strong>Inspector:</strong> {inspection.inspectorId?.firstName}{' '}
                            {inspection.inspectorId?.lastName}
                          </p>
                          <p>
                            <strong>Date:</strong>{' '}
                            {format(new Date(inspection.inspectionDate), 'MMM dd, yyyy')}
                          </p>
                          {inspection.overallRating && (
                            <p>
                              <strong>Rating:</strong>{' '}
                              <span className="capitalize">{inspection.overallRating.replace('_', ' ')}</span>
                            </p>
                          )}
                        </div>
                        {openIssues > 0 && (
                          <div className="flex items-center gap-2 mt-2 sm:mt-3">
                            <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                              {openIssues} open issue(s)
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedInspection(inspection)}
                        className="w-full sm:w-auto flex-shrink-0"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <InspectionForm
          sites={sites}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {selectedInspection && (
        <InspectionDetail
          inspection={selectedInspection}
          onClose={() => setSelectedInspection(null)}
          onUpdate={fetchInspections}
        />
      )}
    </>
  );
}

