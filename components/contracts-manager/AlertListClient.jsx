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
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Filter,
  Bell,
} from 'lucide-react';
import AlertCard from './AlertCard';

/**
 * Alert List Client Component
 * 
 * Displays list of alerts with filters and actions
 */
export default function AlertListClient() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    active: 0,
    critical: 0,
    warning: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('active');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setError('');
      let url = '/api/v1/alerts?';
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`;
      }
      if (severityFilter !== 'all') {
        url += `severity=${severityFilter}&`;
      }
      if (typeFilter !== 'all') {
        url += `type=${typeFilter}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
        setCounts(result.counts || {
          total: result.data.length,
          active: result.data.filter((a) => a.status === 'active').length,
          critical: result.data.filter((a) => a.severity === 'critical' && a.status === 'active').length,
          warning: result.data.filter((a) => a.severity === 'warning' && a.status === 'active').length,
        });
      } else {
        setError(result.error?.message || 'Failed to load alerts');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, typeFilter]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [statusFilter, severityFilter, typeFilter]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  // Handle generate alerts
  const handleGenerateAlerts = async () => {
    try {
      setGenerating(true);
      setError('');

      const response = await fetch('/api/v1/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
        }),
      });

      const result = await response.json();

      if (result.success) {
        fetchAlerts(); // Refresh list
      } else {
        setError(result.error?.message || 'Failed to generate alerts');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

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

  if (loading && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Exception Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage red-flag events across all sites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleGenerateAlerts}
            disabled={generating}
            variant="outline"
            size="sm"
          >
            <Bell className={`h-4 w-4 mr-2 ${generating ? 'animate-pulse' : ''}`} />
            {generating ? 'Generating...' : 'Generate Alerts'}
          </Button>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Alert Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{counts.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{counts.active}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{counts.critical}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warning</p>
                <p className="text-2xl font-bold text-yellow-600">{counts.warning}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cost_variance">Cost Variance</SelectItem>
                <SelectItem value="missed_daily_log">Missed Daily Log</SelectItem>
                <SelectItem value="low_attendance">Low Attendance</SelectItem>
                <SelectItem value="missing_timesheet">Missing Timesheet</SelectItem>
                <SelectItem value="high_incident_rate">High Incident Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No alerts found</p>
              <Button onClick={handleGenerateAlerts} disabled={generating}>
                Generate Alerts
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <AlertCard key={alert._id} alert={alert} onUpdate={fetchAlerts} />
          ))}
        </div>
      )}
    </div>
  );
}

