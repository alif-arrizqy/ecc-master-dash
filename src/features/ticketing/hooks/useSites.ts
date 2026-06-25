/**
 * useSites Hook
 * Hook untuk fetch sites dropdown dengan search capability
 */

import { useQuery } from '@tanstack/react-query';
import { siteApi } from '../services/ticketing.api';

export const useSites = (search?: string) => {
  return useQuery({
    queryKey: ['sites', search],
    queryFn: () =>
      siteApi.getAll({
        search,
        page: 1,
        limit: 50,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
