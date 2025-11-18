'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { GraduationCap, Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import TrainingAssignmentForm from './TrainingAssignmentForm';

export default function TrainingRegisterList({ employees }) {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showDueSoon, setShowDueSoon] = useState(false);

  useEffect(() => {
    fetchTrainings();
  }, [filterStatus, filterType, showOverdue, showDueSoon]);

  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('trainingType', filterType);
      if (showOverdue) params.append('overdue', 'true');
      if (showDueSoon && !showOverdue) params.append('dueSoon', 'true');

      const response = await fetch(`/api/v1/training-register?${params.toString()}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch training records');
      }

      setTrainings(result.data);
    } catch (err) {
      console.error('Error fetching training records:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchTrainings();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'not_started':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Not Started
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Overdue
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Expired
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    return (
      <Badge variant="outline" className="capitalize">
        {type.replace(/([A-Z])/g, ' $1').trim()}
      </Badge>
    );
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 30 && daysUntilDue > 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-muted-foreground">Loading training records...</p>
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
            <Button onClick={fetchTrainings} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdueCount = trainings.filter((t) => t.status === 'overdue').length;
  const dueSoonCount = trainings.filter((t) => isDueSoon(t.dueDate)).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">
              <span className="block sm:inline">Training Records ({trainings.length})</span>
              <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:ml-2 sm:inline">
                {overdueCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {overdueCount} Overdue
                  </Badge>
                )}
                {dueSoonCount > 0 && (
                  <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                    {dueSoonCount} Due Soon
                  </Badge>
                )}
              </div>
            </CardTitle>
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Assign Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="SafePass">SafePass</SelectItem>
                <SelectItem value="CSCS">CSCS</SelectItem>
                <SelectItem value="FirstAid">First Aid</SelectItem>
                <SelectItem value="ManualHandling">Manual Handling</SelectItem>
                <SelectItem value="WorkingAtHeight">Working at Height</SelectItem>
                <SelectItem value="ConfinedSpace">Confined Space</SelectItem>
                <SelectItem value="FireSafety">Fire Safety</SelectItem>
                <SelectItem value="ToolboxTalk">Toolbox Talk</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showOverdue"
                checked={showOverdue}
                onChange={(e) => {
                  setShowOverdue(e.target.checked);
                  if (e.target.checked) setShowDueSoon(false);
                }}
                className="rounded w-4 h-4 flex-shrink-0"
              />
              <Label htmlFor="showOverdue" className="cursor-pointer text-xs sm:text-sm">
                Show Overdue Only
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showDueSoon"
                checked={showDueSoon}
                onChange={(e) => {
                  setShowDueSoon(e.target.checked);
                  if (e.target.checked) setShowOverdue(false);
                }}
                className="rounded w-4 h-4 flex-shrink-0"
                disabled={showOverdue}
              />
              <Label htmlFor="showDueSoon" className="cursor-pointer text-xs sm:text-sm">
                Show Due Soon (30 days)
              </Label>
            </div>
          </div>

          {/* Training List */}
          {trainings.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No training records found</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Assign First Training
              </Button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {trainings.map((training) => (
                <div
                  key={training._id}
                  className={`p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    training.status === 'overdue' || training.status === 'expired'
                      ? 'border-red-300 dark:border-red-700'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{training.title}</h3>
                        {getTypeBadge(training.trainingType)}
                        {getStatusBadge(training.status)}
                        {training.isMandatory && (
                          <Badge variant="outline" className="text-xs border-red-500 text-red-700 dark:text-red-400">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                        <p>
                          <strong>Employee:</strong> {training.employeeId?.firstName}{' '}
                          {training.employeeId?.lastName} ({training.employeeId?.employeeId})
                        </p>
                        {training.description && (
                          <p className="line-clamp-2">
                            {training.description}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm mt-3">
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <p
                            className={`font-medium ${
                              isOverdue(training.dueDate) ? 'text-red-600 dark:text-red-400' : ''
                            }`}
                          >
                            {format(new Date(training.dueDate), 'MMM dd, yyyy')}
                            {isOverdue(training.dueDate) && (
                              <AlertTriangle className="inline h-4 w-4 ml-1" />
                            )}
                          </p>
                        </div>
                        {training.expiryDate && (
                          <div>
                            <span className="text-muted-foreground">Expiry Date:</span>
                            <p
                              className={`font-medium ${
                                new Date(training.expiryDate) < new Date()
                                  ? 'text-red-600 dark:text-red-400'
                                  : ''
                              }`}
                            >
                              {format(new Date(training.expiryDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                        {training.completedDate && (
                          <div>
                            <span className="text-muted-foreground">Completed:</span>
                            <p className="font-medium">
                              {format(new Date(training.completedDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        )}
                        {training.provider && (
                          <div>
                            <span className="text-muted-foreground">Provider:</span>
                            <p className="font-medium">{training.provider}</p>
                          </div>
                        )}
                      </div>
                      {training.certificationId && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <strong>Linked Certification:</strong>{' '}
                          {training.certificationId?.type} (Expires:{' '}
                          {format(new Date(training.certificationId?.expiryDate), 'MMM dd, yyyy')})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <TrainingAssignmentForm
          employees={employees}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}

