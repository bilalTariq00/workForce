import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query Keys - centralized for consistency
export const toolKeys = {
  all: ['tools'] ,
  lists: () => [...toolKeys.all, 'list'] ,
  list: (filters) => [...toolKeys.lists(), { filters }] ,
  details: () => [...toolKeys.all, 'detail'] ,
  detail: (id) => [...toolKeys.details(), id] ,
  assignments: () => [...toolKeys.all, 'assignments'] ,
  assignmentList: (filters) => [...toolKeys.assignments(), { filters }] ,
  assignment: (id) => [...toolKeys.assignments(), id] ,
  requests: () => [...toolKeys.all, 'requests'] ,
  overdue: () => [...toolKeys.all, 'overdue'] ,
};

// Fetch functions
const fetchTools = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  if (filters.status) {
    params.append('status', filters.status);
  }
  if (filters.search) {
    params.append('search', filters.search);
  }

  const response = await fetch(`/api/v1/tools?${params.toString()}`);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch tools');
  }
  return result;
};

const fetchToolAssignments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }
  if (filters.employeeId) {
    params.append('employeeId', filters.employeeId);
  }
  if (filters.toolId) {
    params.append('toolId', filters.toolId);
  }
  if (filters.overdue) {
    params.append('overdue', 'true');
  }

  const response = await fetch(`/api/v1/tools/assignments?${params.toString()}`);
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch assignments');
  }
  return result;
};

const fetchToolRequests = async () => {
  const response = await fetch('/api/v1/tools/requests');
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch requests');
  }
  return result;
};

const fetchOverdueTools = async () => {
  const response = await fetch('/api/v1/tools/overdue');
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch overdue tools');
  }
  return result;
};

// Hooks
export function useTools(filters = {}) {
  return useQuery({
    queryKey: toolKeys.list(filters),
    queryFn: () => fetchTools(filters),
    select: (data) => ({
      tools: data.data || [],
      stats: data.stats || {},
    }),
    staleTime: 0, // Always consider data stale - fetch fresh on every request
    gcTime: 0, // Don't cache - always fetch fresh data
  });
}

export function useToolAssignments(filters = {}) {
  return useQuery({
    queryKey: toolKeys.assignmentList(filters),
    queryFn: () => fetchToolAssignments(filters),
    select: (data) => ({
      assignments: data.data || [],
      stats: data.stats || {},
    }),
    staleTime: 0, // Always consider data stale - fetch fresh on every request
    gcTime: 0, // Don't cache - always fetch fresh data
  });
}

export function useToolRequests() {
  return useQuery({
    queryKey: toolKeys.requests(),
    queryFn: fetchToolRequests,
    select: (data) => data.data || [],
    staleTime: 0, // Always consider data stale - fetch fresh on every request
    gcTime: 0, // Don't cache - always fetch fresh data
  });
}

export function useOverdueTools() {
  return useQuery({
    queryKey: toolKeys.overdue(),
    queryFn: fetchOverdueTools,
    select: (data) => ({
      overdueAssignments: data.data?.overdueAssignments || [],
      byEmployee: data.data?.byEmployee || [],
      stats: data.data?.stats || {},
    }),
    staleTime: 0, // Always consider data stale - fetch fresh on every request
    gcTime: 0, // Don't cache - always fetch fresh data
    // Refetch every 30 seconds for overdue tools
    refetchInterval: 30 * 1000,
  });
}

// Mutations
export function useCreateTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (toolData) => {
      const response = await fetch('/api/v1/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toolData),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create tool');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch tools list immediately
      queryClient.invalidateQueries({ queryKey: toolKeys.all });
      queryClient.refetchQueries({ queryKey: toolKeys.lists() });
    },
  });
}

export function useAssignTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentData) => {
      const response = await fetch('/api/v1/tools/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignmentData,
          expectedReturnDate: new Date(assignmentData.expectedReturnDate).toISOString(),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to assign tool');
      }
      return result;
    },
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: toolKeys.all });
      // Force immediate refetch of all related queries to update counts
      await Promise.all([
        queryClient.refetchQueries({ queryKey: toolKeys.assignments() }),
        queryClient.refetchQueries({ queryKey: toolKeys.lists() }),
        queryClient.refetchQueries({ queryKey: toolKeys.overdue() }),
      ]);
    },
  });
}

export function useReturnTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, returnData }) => {
      const response = await fetch(`/api/v1/tools/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...returnData,
          actualReturnDate: new Date(returnData.actualReturnDate).toISOString(),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to return tool');
      }
      return result;
    },
    onSuccess: async () => {
      // Invalidate all related queries
      await queryClient.invalidateQueries({ queryKey: toolKeys.all });
      // Force immediate refetch of all related queries to update counts
      await Promise.all([
        queryClient.refetchQueries({ queryKey: toolKeys.assignments() }),
        queryClient.refetchQueries({ queryKey: toolKeys.lists() }),
        queryClient.refetchQueries({ queryKey: toolKeys.overdue() }),
      ]);
    },
  });
}

export function useRequestTool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestData) => {
      const response = await fetch('/api/v1/tools/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...requestData,
          expectedStartDate: new Date(requestData.expectedStartDate).toISOString(),
          expectedReturnDate: new Date(requestData.expectedReturnDate).toISOString(),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create request');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: toolKeys.requests() });
      queryClient.refetchQueries({ queryKey: toolKeys.requests() });
    },
  });
}

export function useApproveToolRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status, rejectionReason }) => {
      const response = await fetch('/api/v1/tools/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          rejectionReason,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to process request');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate and refetch all related queries immediately
      queryClient.invalidateQueries({ queryKey: toolKeys.all });
      // Force refetch to get fresh data
      queryClient.refetchQueries({ queryKey: toolKeys.requests() });
      queryClient.refetchQueries({ queryKey: toolKeys.assignments() });
      queryClient.refetchQueries({ queryKey: toolKeys.lists() });
    },
  });
}

