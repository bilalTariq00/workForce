'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  XCircle,
  Info,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import AlertActions from './AlertActions';

/**
 * Alert Card Component
 * 
 * Displays a single alert with details and actions
 */
export default function AlertCard({ alert, onUpdate }) {
  const [actionLoading, setActionLoading] = useState(false);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'acknowledged':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      cost_variance: 'Cost Variance',
      missed_daily_log: 'Missed Daily Log',
      low_attendance: 'Low Attendance',
      missing_timesheet: 'Missing Timesheet',
      high_incident_rate: 'High Incident Rate',
      budget_exceeded: 'Budget Exceeded',
      delayed_delivery: 'Delayed Delivery',
      safety_concern: 'Safety Concern',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={`border-l-4 ${
      alert.severity === 'critical' ? 'border-l-red-500' :
      alert.severity === 'warning' ? 'border-l-yellow-500' :
      'border-l-blue-500'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {alert.title}
                <Badge className={getSeverityBadge(alert.severity)}>
                  {alert.severity}
                </Badge>
                <Badge className={getStatusBadge(alert.status)}>
                  {alert.status}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{alert.siteId?.name || 'Unknown Site'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(alert.generatedAt)}</span>
                </div>
                <div>
                  <span className="text-xs">{getTypeLabel(alert.type)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-foreground">{alert.description}</p>

          {/* Metadata */}
          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Details:</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(alert.metadata).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key.replace(/_/g, ' ')}:</span>{' '}
                    <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acknowledgment/Resolution Info */}
          {alert.status === 'acknowledged' && alert.acknowledgedBy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>
                Acknowledged by {alert.acknowledgedBy?.firstName} {alert.acknowledgedBy?.lastName}
                {alert.acknowledgedAt && ` on ${formatDate(alert.acknowledgedAt)}`}
              </span>
            </div>
          )}

          {alert.status === 'resolved' && alert.resolvedBy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                Resolved by {alert.resolvedBy?.firstName} {alert.resolvedBy?.lastName}
                {alert.resolvedAt && ` on ${formatDate(alert.resolvedAt)}`}
              </span>
            </div>
          )}

          {/* Actions */}
          {alert.status === 'active' && (
            <AlertActions alert={alert} onUpdate={onUpdate} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

