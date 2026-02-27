/**
 * useTicketTypes Hook
 * Hook untuk fetch ticket types dropdown data
 */

import { useQuery } from '@tanstack/react-query';
import { ticketTypeApi } from '../services/ticketing.api';

export const useTicketTypes = () => {
  return useQuery({
    queryKey: ['ticket-types'],
    queryFn: () => ticketTypeApi.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
