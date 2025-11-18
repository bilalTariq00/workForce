'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, UserPlus, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function IncidentTriageModal({
  incident,
  onClose,
  onSuccess,
}) {
  const [action, setAction] = useState(null); // 'assign', 'resolve', 'close'
  const [assignedTo, setAssignedTo] = useState('');
  const [ehsOfficers, setEhsOfficers] = useState([]);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [actions, setActions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  useEffect(() => {
    if (action === 'assign') {
      fetchEHSOfficers();
    }
  }, [action]);

  const fetchEHSOfficers = async () => {
    setLoadingOfficers(true);
    try {
      const response = await fetch('/api/v1/employees?role=ehs_officer');
      const result = await response.json();
      if (result.success) {
        setEhsOfficers(result.data.filter((emp) => emp.status === 'active'));
      }
    } catch (err) {
      console.error('Error fetching EHS officers:', err);
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleSubmit = async () => {
    if (!action) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (action === 'assign') {
        if (!assignedTo) {
          setError('Please select an EHS officer to assign');
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(`/api/v1/incidents/${incident._id}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assignedTo }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to assign incident');
        }
      } else if (action === 'resolve') {
        const response = await fetch(`/api/v1/incidents/${incident._id}/resolve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            investigationNotes,
            actions: actions.length > 0 ? actions : undefined,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to resolve incident');
        }
      } else if (action === 'close') {
        const response = await fetch(`/api/v1/incidents/${incident._id}/close`, {
          method: 'POST',
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error?.message || 'Failed to close incident');
        }
      }

      onSuccess();
    } catch (err) {
      console.error('Error processing incident:', err);
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        description: '',
        assignedTo: '',
        dueDate: '',
        notes: '',
      },
    ]);
  };

  const updateAction = (index, field, value) => {
    const newActions = [...actions];
    newActions[index][field] = value;
    setActions(newActions);
  };

  const removeAction = (index) => {
    setActions(actions.filter((_, i) => i !== index));
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Incident Triage & Investigation</DialogTitle>
          <DialogDescription className="text-sm">
            Review, assign, and investigate this incident
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium capitalize">
                {incident.type === 'near_miss' ? 'Near-Miss' : 'Incident'}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Severity</Label>
              <div className="mt-1">{getSeverityBadge(incident.severity)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Site</Label>
              <p className="font-medium">
                {incident.siteId?.name} ({incident.siteId?.siteCode})
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Reported By</Label>
              <p className="font-medium">
                {incident.reportedBy?.firstName} {incident.reportedBy?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {incident.reportedBy?.employeeId}
              </p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Occurred At</Label>
            <p className="font-medium">
              {format(new Date(incident.occurredAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          {incident.location && (
            <div>
              <Label className="text-muted-foreground">Location</Label>
              <p className="font-medium">{incident.location}</p>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground">Description</Label>
            <p className="text-sm mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
              {incident.description}
            </p>
          </div>

          {incident.photos && incident.photos.length > 0 && (
            <div>
              <Label className="text-muted-foreground">Photos</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {incident.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div className="space-y-2 pt-4 border-t">
            <Label>Action *</Label>
            <div className="flex gap-4">
              {incident.status === 'reported' && (
                <Button
                  type="button"
                  variant={action === 'assign' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setAction('assign');
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </Button>
              )}
              {incident.status === 'under_investigation' && (
                <>
                  <Button
                    type="button"
                    variant={action === 'resolve' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => {
                      setAction('resolve');
                      setError(null);
                    }}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve
                  </Button>
                </>
              )}
              {incident.status === 'resolved' && (
                <Button
                  type="button"
                  variant={action === 'close' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => {
                    setAction('close');
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Close
                </Button>
              )}
            </div>
          </div>

          {/* Assign Action */}
          {action === 'assign' && (
            <div>
              <Label htmlFor="assignedTo">Assign to EHS Officer *</Label>
              <Select
                value={assignedTo}
                onValueChange={setAssignedTo}
                disabled={loadingOfficers}
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select EHS officer" />
                </SelectTrigger>
                <SelectContent>
                  {loadingOfficers ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : (
                    ehsOfficers.map((officer) => (
                      <SelectItem key={officer._id} value={officer._id}>
                        {officer.firstName} {officer.lastName} ({officer.employeeId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Resolve Action */}
          {action === 'resolve' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="investigationNotes">Investigation Notes</Label>
                <Textarea
                  id="investigationNotes"
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Add investigation findings and notes..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Corrective Actions (Optional)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addAction}
                  >
                    Add Action
                  </Button>
                </div>
                {actions.map((action, index) => (
                  <div key={index} className="p-4 border rounded-lg mb-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Action {index + 1}</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeAction(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Action description..."
                      value={action.description}
                      onChange={(e) => updateAction(index, 'description', e.target.value)}
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Assign To</Label>
                        <Input
                          placeholder="Employee ID"
                          value={action.assignedTo}
                          onChange={(e) => updateAction(index, 'assignedTo', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Due Date</Label>
                        <Input
                          type="date"
                          value={action.dueDate}
                          onChange={(e) => updateAction(index, 'dueDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!action || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'assign' && (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Incident
                  </>
                )}
                {action === 'resolve' && (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Resolve Incident
                  </>
                )}
                {action === 'close' && (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Close Incident
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

