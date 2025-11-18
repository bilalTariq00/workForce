'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AlertTriangle, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function IncidentList({ incidents }) {
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

  if (incidents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Incident Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No incidents reported yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Report incidents or near-misses to help improve site safety
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">My Incident Reports ({incidents.length})</CardTitle>
      </CardHeader>
      <CardContent>
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

              {incident.photos && incident.photos.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    <strong>Photos:</strong> {incident.photos.length}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {incident.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-16 sm:h-20 object-cover rounded border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

