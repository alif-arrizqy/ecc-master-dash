/**
 * useTicketDetail Hook
 * Hook untuk fetch detail single ticket
 */

import { useQuery } from '@tanstack/react-query';
import { troubleTicketApi } from '../services/ticketing.api';

export const useTicketDetail = (ticketNumber?: string) => {
  return useQuery({
    queryKey: ['ticket-detail', ticketNumber],
    queryFn: () => troubleTicketApi.getDetail(ticketNumber!),
    enabled: !!ticketNumber,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
