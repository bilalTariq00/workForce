'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, XCircle, Plus, CheckCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function InspectionDetail({ inspection, onClose, onUpdate }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [newIssue, setNewIssue] = useState({
    description: '',
    severity: 'medium',
    location: '',
    photoUrl: '',
    assignedTo: '',
    dueDate: '',
  });

  const handleComplete = async () => {
    if (!confirm('Mark this inspection as completed? This cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/inspections/${inspection._id}/complete`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to complete inspection');
      }

      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error completing inspection:', err);
      setError(err.message || 'Failed to complete inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIssue = async () => {
    if (!newIssue.description) {
      setError('Please provide an issue description');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get current inspection to add issue
      const currentIssues = inspection.issues || [];
      const updatedIssues = [
        ...currentIssues,
        {
          ...newIssue,
          status: 'open',
          dueDate: newIssue.dueDate ? new Date(newIssue.dueDate) : undefined,
        },
      ];

      const response = await fetch(`/api/v1/inspections/${inspection._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issues: updatedIssues,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to add issue');
      }

      setNewIssue({
        description: '',
        severity: 'medium',
        location: '',
        photoUrl: '',
        assignedTo: '',
        dueDate: '',
      });
      setShowIssueForm(false);
      onUpdate();
    } catch (err) {
      console.error('Error adding issue:', err);
      setError(err.message || 'Failed to add issue');
    } finally {
      setIsSubmitting(false);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline">Open</Badge>;
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
            In Progress
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="default" className="bg-green-500">
            Resolved
          </Badge>
        );
      case 'closed':
        return (
          <Badge variant="default" className="bg-blue-500">
            Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openIssues = inspection.issues?.filter(
    (issue) => issue.status === 'open' || issue.status === 'in_progress'
  ) || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl truncate">{inspection.title}</DialogTitle>
          <DialogDescription className="text-sm">
            Inspection details and issue management
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Inspection Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Site</Label>
              <p className="font-medium">
                {inspection.siteId?.name} ({inspection.siteId?.siteCode})
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <p className="font-medium capitalize">{inspection.type}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Inspection Date</Label>
              <p className="font-medium">
                {format(new Date(inspection.inspectionDate), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Inspector</Label>
              <p className="font-medium">
                {inspection.inspectorId?.firstName} {inspection.inspectorId?.lastName}
              </p>
            </div>
            {inspection.overallRating && (
              <div>
                <Label className="text-muted-foreground">Overall Rating</Label>
                <p className="font-medium capitalize">
                  {inspection.overallRating.replace('_', ' ')}
                </p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                {inspection.status === 'draft' ? (
                  <Badge variant="outline">Draft</Badge>
                ) : (
                  <Badge variant="default" className="bg-green-500">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {inspection.notes && (
            <div>
              <Label className="text-muted-foreground">Notes</Label>
              <p className="text-sm mt-1 p-2 bg-muted rounded whitespace-pre-wrap">
                {inspection.notes}
              </p>
            </div>
          )}

          {/* Checklist Items */}
          {inspection.checklistItems && inspection.checklistItems.length > 0 && (
            <div>
              <Label className="text-muted-foreground mb-2 block">Checklist Items</Label>
              <div className="space-y-2">
                {inspection.checklistItems.map((item, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.category}: {item.item}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                      <Badge
                        variant={item.status === 'pass' ? 'default' : 'destructive'}
                        className={item.status === 'pass' ? 'bg-green-500' : ''}
                      >
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-muted-foreground">
                Issues ({inspection.issues?.length || 0})
                {openIssues.length > 0 && (
                  <span className="ml-2 text-orange-600 dark:text-orange-400">
                    ({openIssues.length} open)
                  </span>
                )}
              </Label>
              {inspection.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowIssueForm(!showIssueForm)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Issue
                </Button>
              )}
            </div>

            {/* Add Issue Form */}
            {showIssueForm && inspection.status === 'draft' && (
              <div className="p-4 border rounded-lg mb-4 space-y-4 bg-muted/50">
                <div>
                  <Label>Issue Description *</Label>
                  <Textarea
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Describe the issue..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Severity *</Label>
                    <Select
                      value={newIssue.severity}
                      onValueChange={(value) => setNewIssue({ ...newIssue, severity: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={newIssue.location}
                      onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
                      placeholder="Location on site"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assign To (Employee ID)</Label>
                    <Input
                      value={newIssue.assignedTo}
                      onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                      placeholder="Employee ID"
                    />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newIssue.dueDate}
                      onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddIssue} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Issue
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowIssueForm(false);
                      setNewIssue({
                        description: '',
                        severity: 'medium',
                        location: '',
                        photoUrl: '',
                        assignedTo: '',
                        dueDate: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Issues List */}
            {inspection.issues && inspection.issues.length > 0 ? (
              <div className="space-y-3">
                {inspection.issues.map((issue, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityBadge(issue.severity)}
                          {getStatusBadge(issue.status)}
                        </div>
                        <p className="text-sm font-medium mb-1">{issue.description}</p>
                        {issue.location && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Location:</strong> {issue.location}
                          </p>
                        )}
                        {issue.assignedTo && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Assigned to:</strong> {issue.assignedTo?.firstName}{' '}
                            {issue.assignedTo?.lastName || issue.assignedTo}
                          </p>
                        )}
                        {issue.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Due:</strong>{' '}
                            {format(new Date(issue.dueDate), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No issues logged
              </div>
            )}
          </div>

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
            Close
          </Button>
          {inspection.status === 'draft' && (
            <Button onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

