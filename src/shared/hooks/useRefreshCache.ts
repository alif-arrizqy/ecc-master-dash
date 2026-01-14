/**
 * Hook untuk refresh/reset Redis cache
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { slaApi } from '@/lib/api';
import { useToast } from '@/shared/hooks/use-toast';
import { getSLADashboardDateRange } from '@/shared/lib/dateUtils';

export function useRefreshCache() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params?: { startDate?: string; endDate?: string }) => {
      // Jika tidak ada params, gunakan dashboard date range
      if (!params) {
        const dashboardDateRange = getSLADashboardDateRange();
        params = {
          startDate: dashboardDateRange.startDate,
          endDate: dashboardDateRange.endDate,
        };
      }
      
      return await slaApi.refreshCache(params);
    },
    onSuccess: (data) => {
      // Invalidate semua query cache untuk memaksa refetch
      queryClient.invalidateQueries();
      
      toast({
        title: 'Berhasil',
        description: `Cache berhasil di-refresh. Data akan dimuat ulang.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal refresh cache. Silakan coba lagi.',
        variant: 'destructive',
      });
    },
  });
}

