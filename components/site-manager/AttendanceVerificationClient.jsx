'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * Attendance Verification Client Component
 * 
 * Displays planned vs actual headcount comparison
 * Shows present, missing, and unexpected employees
 */
export default function AttendanceVerificationClient({ siteId }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch attendance verification data
  const fetchData = async (date = selectedDate) => {
    try {
      setError('');
      const response = await fetch(
        `/api/v1/sites/${siteId}/attendance-verification?date=${date}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to load attendance data');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Error fetching attendance verification:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle date change
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setLoading(true);
    fetchData(newDate);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={handleRefresh}>Try Again</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
        return <XCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Attendance Verification
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compare planned vs actual headcount
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-auto"
            />
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned Headcount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planned Headcount</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.plannedHeadcount}</div>
            <p className="text-xs text-muted-foreground mt-1">Expected workers</p>
          </CardContent>
        </Card>

        {/* Actual Headcount */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Headcount</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.actualHeadcount}</div>
            <p className="text-xs text-muted-foreground mt-1">Present workers</p>
          </CardContent>
        </Card>

        {/* Difference */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Difference</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                data.difference > 0
                  ? 'text-green-600'
                  : data.difference < 0
                  ? 'text-red-600'
                  : 'text-foreground'
              }`}
            >
              {data.difference > 0 ? '+' : ''}
              {data.difference}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.difference > 0 ? 'More than planned' : data.difference < 0 ? 'Less than planned' : 'On target'}
            </p>
          </CardContent>
        </Card>

        {/* Attendance Percentage */}
        <Card className={getStatusColor(data.status)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            {getStatusIcon(data.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendancePercentage}%</div>
            <p className="text-xs mt-1 opacity-80">
              {data.status === 'good'
                ? 'On target'
                : data.status === 'warning'
                ? 'Below target'
                : 'Critical'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Missing Workers Alert */}
      {data.missingEmployees.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Missing Workers ({data.missingEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.missingEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employeeId} • {employee.email}
                    </p>
                  </div>
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Present Workers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Present Workers ({data.presentEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.presentEmployees.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No workers present today</p>
          ) : (
            <div className="space-y-2">
              {data.presentEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employeeId} • Signed in:{' '}
                      {new Date(employee.signInTime).toLocaleTimeString()}
                      {employee.hoursWorked && ` • ${employee.hoursWorked}h worked`}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unexpected Workers */}
      {data.unexpectedEmployees.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Unexpected Workers ({data.unexpectedEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-800 mb-3">
              These workers are present but not assigned to this site
            </p>
            <div className="space-y-2">
              {data.unexpectedEmployees.map((employee) => (
                <div
                  key={employee._id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-200"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.employeeId} • Signed in:{' '}
                      {new Date(employee.signInTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Issues Message */}
      {data.missingEmployees.length === 0 &&
        data.unexpectedEmployees.length === 0 &&
        data.presentEmployees.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-center justify-center py-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <p className="text-green-800 font-medium">
                  All expected workers are present. No discrepancies found.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

