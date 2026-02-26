/**
 * usePics Hook
 * Hook untuk fetch PIC (Person In Charge) dropdown data
 */

import { useQuery } from '@tanstack/react-query';
import { picApi } from '../services/ticketing.api';

export const usePics = () => {
  return useQuery({
    queryKey: ['pics'],
    queryFn: () => picApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
