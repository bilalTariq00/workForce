'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

export default function UserToolsManager() {
  const [assignments, setAssignments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    toolId: '',
    quantity: 1,
    expectedStartDate: '',
    expectedReturnDate: '',
    purpose: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's assignments
      const assignmentsRes = await fetch('/api/v1/tools/assignments');
      const assignmentsResult = await assignmentsRes.json();
      if (assignmentsResult.success) {
        setAssignments(assignmentsResult.data || []);
      }

      // Fetch user's requests
      const requestsRes = await fetch('/api/v1/tools/requests');
      const requestsResult = await requestsRes.json();
      if (requestsResult.success) {
        setRequests(requestsResult.data || []);
      }

      // Fetch available tools
      const toolsRes = await fetch('/api/v1/tools?status=active');
      const toolsResult = await toolsRes.json();
      if (toolsResult.success) {
        setTools(toolsResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTool = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/tools/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestForm,
          expectedStartDate: new Date(requestForm.expectedStartDate).toISOString(),
          expectedReturnDate: new Date(requestForm.expectedReturnDate).toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsRequestModalOpen(false);
        setRequestForm({
          toolId: '',
          quantity: 1,
          expectedStartDate: '',
          expectedReturnDate: '',
          purpose: '',
        });
        fetchData();
        alert('Tool request submitted successfully');
      } else {
        alert(result.error || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error requesting tool:', error);
      alert('An error occurred');
    }
  };

  const activeAssignments = assignments.filter(
    (a) => a.status === 'assigned' || a.status === 'overdue'
  );
  const overdueAssignments = assignments.filter((a) => a.status === 'overdue');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assigned Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAssignments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests.filter((r) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueAssignments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Assigned Tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Assigned Tools</CardTitle>
              <CardDescription>Tools currently assigned to you</CardDescription>
            </div>
            <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Tool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Request Tool</DialogTitle>
                  <DialogDescription>
                    Submit a request to borrow a tool from inventory
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRequestTool} className="space-y-4">
                  <div>
                    <Label htmlFor="toolId">Tool *</Label>
                    <Select
                      value={requestForm.toolId}
                      onValueChange={(value) =>
                        setRequestForm({ ...requestForm, toolId: value, quantity: 1 })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool" />
                      </SelectTrigger>
                      <SelectContent>
                        {tools
                          .filter((t) => t.availableQuantity > 0)
                          .map((t) => (
                            <SelectItem key={t._id} value={t._id}>
                              {t.name} ({t.availableQuantity} available)
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={requestForm.quantity}
                      onChange={(e) =>
                        setRequestForm({
                          ...requestForm,
                          quantity: parseInt(e.target.value) || 1,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedStartDate">Start Date *</Label>
                      <Input
                        id="expectedStartDate"
                        type="datetime-local"
                        value={requestForm.expectedStartDate}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, expectedStartDate: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="expectedReturnDate">Return Date *</Label>
                      <Input
                        id="expectedReturnDate"
                        type="datetime-local"
                        value={requestForm.expectedReturnDate}
                        onChange={(e) =>
                          setRequestForm({ ...requestForm, expectedReturnDate: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      value={requestForm.purpose}
                      onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
                      rows={3}
                      placeholder="What will you use this tool for?"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRequestModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Submit Request</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAssignments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No tools currently assigned
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeAssignments.map((assignment) => {
                      const returnDate = new Date(assignment.expectedReturnDate);
                      const isOverdue = returnDate < new Date() && assignment.status !== 'returned';
                      return (
                        <TableRow key={assignment._id}>
                          <TableCell className="font-medium">
                            {assignment.toolId?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{assignment.quantity}</TableCell>
                          <TableCell>
                            {format(new Date(assignment.assignedDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                            {format(returnDate, 'MMM dd, yyyy')}
                            {isOverdue && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                assignment.status === 'returned'
                                  ? 'default'
                                  : assignment.status === 'overdue'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {assignment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle>My Tool Requests</CardTitle>
          <CardDescription>Your tool request history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No requests yet
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request._id}>
                      <TableCell className="font-medium">
                        {request.toolId?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        {format(new Date(request.requestedDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.expectedReturnDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'approved' || request.status === 'fulfilled'
                              ? 'default'
                              : request.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                        {request.rejectionReason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {request.rejectionReason}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

