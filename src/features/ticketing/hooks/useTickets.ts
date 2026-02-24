/**
 * useTickets Hook
 * Hook untuk manage list ticket dengan pagination dan filters
 */

import { useQuery } from '@tanstack/react-query';
import { troubleTicketApi } from '../services/ticketing.api';
import type { TicketFilterParams } from '../types/ticketing.types';

export const useTickets = (params?: TicketFilterParams) => {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () =>
      troubleTicketApi.getAll({
        page: params?.page || 1,
        limit: params?.perPage || 10,
        status: params?.status ? String(params.status) : undefined,
        ticketType: params?.ticketType ? Number(params.ticketType) : undefined,
        siteId: params?.siteId || undefined,
        siteName: params?.siteName || undefined,
        fromDate: params?.fromDate,
        toDate: params?.toDate,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
