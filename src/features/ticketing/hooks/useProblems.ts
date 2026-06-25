/**
 * useProblems Hook
 * Hook untuk fetch problems dropdown data
 */

import { useQuery } from '@tanstack/react-query';
import { problemApi } from '../services/ticketing.api';

export const useProblems = () => {
  return useQuery({
    queryKey: ['problems'],
    queryFn: () => problemApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
