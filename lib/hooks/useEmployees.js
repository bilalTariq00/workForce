import { useQuery } from '@tanstack/react-query';

export const employeeKeys = {
  all: ['employees'] ,
  lists: () => [...employeeKeys.all, 'list'] ,
  list: (filters) => [...employeeKeys.lists(), { filters }] ,
  details: () => [...employeeKeys.all, 'detail'] ,
  detail: (id) => [...employeeKeys.details(), id] ,
};

const fetchEmployees = async () => {
  const response = await fetch('/api/v1/employees');
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to fetch employees');
  }
  return result.data || [];
};

export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.list({}),
    queryFn: fetchEmployees,
    staleTime: 10 * 60 * 1000, // Employees don't change often, cache for 10 minutes
  });
}

