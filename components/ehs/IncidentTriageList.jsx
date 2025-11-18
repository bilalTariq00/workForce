'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import IncidentTriageModal from './IncidentTriageModal';

export default function IncidentTriageList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchIncidents();
  }, [filterStatus, filterSeverity]);

  const fetchIncidents = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);

      const response = await fetch(`/api/v1/incidents?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch incidents');
      }

      // Filter by search term
      let filtered = result.data;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (inc) =>
            inc.description?.toLowerCase().includes(term) ||
            inc.siteId?.name?.toLowerCase().includes(term) ||
            inc.reportedBy?.firstName?.toLowerCase().includes(term) ||
            inc.reportedBy?.lastName?.toLowerCase().includes(term)
        );
      }

      setIncidents(filtered);
    } catch (err) {
      console.error('Error fetching incidents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriageSuccess = () => {
    setSelectedIncident(null);
    fetchIncidents();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reported':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Reported
          </Badge>
        );
      case 'under_investigation':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Eye className="h-3 w-3" />
            Under Investigation
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Resolved
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-blue-500">
            <CheckCircle className="h-3 w-3" />
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500',
    };
    return (
      <Badge className={`${colors[severity] || 'bg-gray-500'} text-white`}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading incidents...</p>
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
            <Button onClick={fetchIncidents} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const reportedIncidents = incidents.filter((i) => i.status === 'reported');
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            <span className="block sm:inline">All Incidents ({incidents.length})</span>
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-2 sm:inline">
              {reportedIncidents.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {reportedIncidents.length} Reported
                </Badge>
              )}
              {criticalIncidents.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {criticalIncidents.length} Critical
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchIncidents();
                }}
                className="w-full pl-9 pr-4 py-2 border rounded-lg"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Incidents List */}
          {incidents.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No incidents found</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident._id}
                  className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground capitalize text-sm sm:text-base">
                          {incident.type === 'near_miss' ? 'Near-Miss' : 'Incident'}
                        </h3>
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                      </div>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <p>
                          <strong>Site:</strong> {incident.siteId?.name} ({incident.siteId?.siteCode})
                        </p>
                        <p>
                          <strong>Reported by:</strong> {incident.reportedBy?.firstName}{' '}
                          {incident.reportedBy?.lastName} ({incident.reportedBy?.employeeId})
                        </p>
                        {incident.location && (
                          <p>
                            <strong>Location:</strong> {incident.location}
                          </p>
                        )}
                        <p className="line-clamp-2">
                          {incident.description}
                        </p>
                      </div>
                    </div>
                    {(incident.status === 'reported' || incident.status === 'under_investigation') && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedIncident(incident)}
                        className="w-full sm:w-auto flex-shrink-0"
                      >
                        {incident.status === 'reported' ? 'Triage' : 'Investigate'}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-3">
                    <div>
                      <span className="text-muted-foreground">Occurred:</span>
                      <p className="font-medium">
                        {format(new Date(incident.occurredAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reported:</span>
                      <p className="font-medium">
                        {format(new Date(incident.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {incident.assignedTo && (
                    <div className="mt-3 text-sm text-muted-foreground">
                      <strong>Assigned to:</strong> {incident.assignedTo?.firstName}{' '}
                      {incident.assignedTo?.lastName}
                    </div>
                  )}

                  {incident.actions && incident.actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Corrective Actions:</strong> {incident.actions.length}
                      </p>
                    </div>
                  )}

                  {incident.photos && incident.photos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Photos:</strong> {incident.photos.length}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {incident.photos.slice(0, 4).map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedIncident && (
        <IncidentTriageModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onSuccess={handleTriageSuccess}
        />
      )}
    </>
  );
}

