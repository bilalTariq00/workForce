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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  Wrench,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import CreateToolModal from './CreateToolModal';
import AssignToolModal from './AssignToolModal';
import ReturnToolModal from './ReturnToolModal';
import {
  useTools,
  useToolAssignments,
  useToolRequests,
  useOverdueTools,
} from '@/lib/hooks/useTools';

export default function ToolInventoryManager() {
  const [activeTab, setActiveTab] = useState('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Use TanStack Query hooks for data fetching
  const { data: toolsData, isLoading: toolsLoading, refetch: refetchTools } = useTools({
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    search: searchTerm || undefined,
    status: 'active',
  });

  const { data: assignmentsData, isLoading: assignmentsLoading, refetch: refetchAssignments } = useToolAssignments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const { data: requestsData, isLoading: requestsLoading, refetch: refetchRequests } = useToolRequests();
  const { data: overdueData, isLoading: overdueLoading, refetch: refetchOverdue } = useOverdueTools();

  // Extract data
  const tools = toolsData?.tools || [];
  const stats = toolsData?.stats || {
    totalTools: 0,
    totalQuantity: 0,
    totalAvailable: 0,
    totalAssigned: 0,
  };
  const assignments = assignmentsData?.assignments || [];
  const requests = requestsData || [];
  const overdue = overdueData?.overdueAssignments || [];

  // Determine loading state based on active tab
  const loading =
    (activeTab === 'tools' && toolsLoading) ||
    (activeTab === 'assignments' && assignmentsLoading) ||
    (activeTab === 'requests' && requestsLoading) ||
    (activeTab === 'overdue' && overdueLoading);

  // Refetch function for manual refresh
  const fetchData = async () => {
    if (activeTab === 'tools') {
      await refetchTools();
    } else if (activeTab === 'assignments') {
      await refetchAssignments();
    } else if (activeTab === 'requests') {
      await refetchRequests();
    } else if (activeTab === 'overdue') {
      await refetchOverdue();
    }
  };

  const handleCreateTool = () => {
    setIsCreateModalOpen(true);
  };

  const handleAssignTool = (tool = null) => {
    setSelectedTool(tool);
    setIsAssignModalOpen(true);
  };

  const handleReturnTool = (assignment) => {
    setSelectedAssignment(assignment);
    setIsReturnModalOpen(true);
  };

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch('/api/v1/tools/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status: 'approved' }),
      });

      const result = await response.json();
      if (result.success) {
        fetchData();
        alert('Request approved successfully');
      } else {
        alert(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred');
    }
  };

  const handleRejectRequest = async (requestId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      const response = await fetch('/api/v1/tools/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status: 'rejected',
          rejectionReason: reason,
        }),
      });

      const result = await response.json();
      if (result.success) {
        fetchData();
        alert('Request rejected');
      } else {
        alert(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('An error occurred');
    }
  };

  const tabs = [
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'assignments', label: 'Assignments', icon: Package },
    { id: 'requests', label: 'Requests', icon: Clock },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTools}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuantity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalAvailable}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalAssigned}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'outline'}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.id === 'overdue' && overdue.length > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {overdue.length}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
            {activeTab === 'tools' && (
              <Button onClick={handleCreateTool}>
                <Plus className="h-4 w-4 mr-2" />
                Add Tool
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Tools Tab */}
              {activeTab === 'tools' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tools..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') fetchData();
                        }}
                        className="pl-10"
                      />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="hand_tools">Hand Tools</SelectItem>
                        <SelectItem value="power_tools">Power Tools</SelectItem>
                        <SelectItem value="safety_equipment">Safety Equipment</SelectItem>
                        <SelectItem value="heavy_machinery">Heavy Machinery</SelectItem>
                        <SelectItem value="vehicles">Vehicles</SelectItem>
                        <SelectItem value="measuring_tools">Measuring Tools</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={fetchData} variant="outline">
                      Filter
                    </Button>
                  </div>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Assigned</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tools.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              No tools found
                            </TableCell>
                          </TableRow>
                        ) : (
                          tools.map((tool) => (
                            <TableRow key={tool._id}>
                              <TableCell className="font-medium">{tool.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {tool.category?.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>{tool.totalQuantity}</TableCell>
                              <TableCell className="text-green-600">
                                {tool.availableQuantity}
                              </TableCell>
                              <TableCell className="text-blue-600">
                                {tool.assignedQuantity}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    tool.status === 'active' ? 'default' : 'secondary'
                                  }
                                >
                                  {tool.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAssignTool(tool)}
                                    disabled={tool.availableQuantity === 0}
                                  >
                                    Assign
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Assigned Date</TableHead>
                          <TableHead>Return Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8">
                              No assignments found
                            </TableCell>
                          </TableRow>
                        ) : (
                          assignments.map((assignment) => (
                            <TableRow key={assignment._id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div>{assignment.toolId?.name || 'N/A'}</div>
                                  {assignment.toolId?.brand && (
                                    <div className="text-xs text-muted-foreground">
                                      {assignment.toolId.brand}
                                      {assignment.toolId.model && ` - ${assignment.toolId.model}`}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {assignment.toolId?.category
                                    ?.replace('_', ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase()) || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div>
                                    {assignment.employeeId?.firstName}{' '}
                                    {assignment.employeeId?.lastName}
                                  </div>
                                  {assignment.employeeId?.employeeId && (
                                    <div className="text-xs text-muted-foreground">
                                      {assignment.employeeId.employeeId}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{assignment.quantity}</TableCell>
                              <TableCell>
                                {format(new Date(assignment.assignedDate), 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>
                                {assignment.actualReturnDate ? (
                                  <div>
                                    <div className="text-green-600">
                                      {format(
                                        new Date(assignment.actualReturnDate),
                                        'MMM dd, yyyy'
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      (Returned)
                                    </div>
                                  </div>
                                ) : (
                                  format(
                                    new Date(assignment.expectedReturnDate),
                                    'MMM dd, yyyy'
                                  )
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
                              <TableCell>
                                {assignment.status !== 'returned' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReturnTool(assignment)}
                                  >
                                    Return
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Requested Date</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No requests found
                          </TableCell>
                        </TableRow>
                      ) : (
                        requests.map((request) => (
                          <TableRow key={request._id}>
                            <TableCell className="font-medium">
                              {request.toolId?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {request.employeeId?.firstName} {request.employeeId?.lastName}
                            </TableCell>
                            <TableCell>{request.quantity}</TableCell>
                            <TableCell>
                              {format(new Date(request.requestedDate), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {format(
                                new Date(request.expectedReturnDate),
                                'MMM dd, yyyy'
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  request.status === 'approved'
                                    ? 'default'
                                    : request.status === 'rejected'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {request.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveRequest(request._id)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request._id)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Overdue Tab */}
              {activeTab === 'overdue' && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Expected Return</TableHead>
                        <TableHead>Days Late</TableHead>
                        <TableHead>Fine</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdue.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No overdue tools
                          </TableCell>
                        </TableRow>
                      ) : (
                        overdue.map((assignment) => {
                          const daysLate = Math.ceil(
                            (new Date() -
                              new Date(assignment.expectedReturnDate)) /
                              (1000 * 60 * 60 * 24)
                          );
                          return (
                            <TableRow key={assignment._id}>
                              <TableCell className="font-medium">
                                {assignment.toolId?.name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                {assignment.employeeId?.firstName}{' '}
                                {assignment.employeeId?.lastName}
                              </TableCell>
                              <TableCell>{assignment.quantity}</TableCell>
                              <TableCell>
                                {format(
                                  new Date(assignment.expectedReturnDate),
                                  'MMM dd, yyyy'
                                )}
                              </TableCell>
                              <TableCell className="text-red-600 font-semibold">
                                {daysLate} days
                              </TableCell>
                              <TableCell className="font-semibold">
                                £{assignment.calculatedFine?.toFixed(2) || '0.00'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReturnTool(assignment)}
                                >
                                  Return
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateToolModal
        open={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          // Data will automatically refetch due to mutation invalidation
        }}
      />
      <AssignToolModal
        open={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedTool(null);
          // Data will automatically refetch due to mutation invalidation
        }}
        tool={selectedTool}
      />
      <ReturnToolModal
        open={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedAssignment(null);
          // Data will automatically refetch due to mutation invalidation
        }}
        assignment={selectedAssignment}
      />
    </div>
  );
}

