/**
 * React Query hooks untuk Monitoring Module
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitoringApi } from '../services/monitoring.api';
import { MonitoringFilters, SiteDownWithStatus } from '../types/monitoring.types';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format duration dari seconds ke readable format
 */
const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} hari ${hours} jam`;
  } else if (hours > 0) {
    return `${hours} jam ${minutes} menit`;
  } else {
    return `${minutes} menit`;
  }
};

/**
 * Tentukan status berdasarkan durasi down
 */
const getSiteDownStatus = (downSeconds: number): 'critical' | 'warning' | 'normal' => {
  const days = downSeconds / 86400;
  if (days > 30) return 'critical';
  if (days > 7) return 'warning';
  return 'normal';
};

/**
 * Transform site down data dengan status dan formatted fields
 */
const transformSiteDown = (site: any): SiteDownWithStatus => {
  const status = getSiteDownStatus(site.downSeconds);
  const downSinceDate = new Date(site.downSince);
  
  return {
    ...site,
    status,
    formattedDuration: formatDuration(site.downSeconds),
    formattedDownSince: formatDistanceToNow(downSinceDate, {
      addSuffix: true,
      locale: id,
    }),
  };
};

/**
 * Hook untuk fetch site down data
 */
export const useSiteDown = (filters?: MonitoringFilters) => {
  return useQuery({
    queryKey: ['monitoring', 'site-down', filters],
    queryFn: async () => {
      const response = await monitoringApi.getSiteDown(filters);
      return {
        ...response,
        data: response.data.map(transformSiteDown),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Auto-refresh setiap 5 menit
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook untuk fetch site up data
 */
export const useSiteUp = (filters?: MonitoringFilters) => {
  return useQuery({
    queryKey: ['monitoring', 'site-up', filters],
    queryFn: () => monitoringApi.getSiteUp(filters),
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Auto-refresh setiap 5 menit
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook untuk fetch site down by siteId
 */
export const useSiteDownBySiteId = (siteId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'site-down', siteId],
    queryFn: () => monitoringApi.getSiteDownBySiteId(siteId),
    enabled: !!siteId,
  });
};

/**
 * Hook untuk fetch site up by siteId
 */
export const useSiteUpBySiteId = (siteId: string) => {
  return useQuery({
    queryKey: ['monitoring', 'site-up', siteId],
    queryFn: () => monitoringApi.getSiteUpBySiteId(siteId),
    enabled: !!siteId,
  });
};

/**
 * Hook untuk sync site down dari NMS
 */
export const useSyncSiteDown = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => monitoringApi.syncSiteDown(),
    onSuccess: () => {
      // Invalidate dan refetch site down queries
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'site-down'] });
    },
  });
};

/**
 * Hook untuk sync site up dari NMS
 */
export const useSyncSiteUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => monitoringApi.syncSiteUp(),
    onSuccess: () => {
      // Invalidate dan refetch site up queries
      queryClient.invalidateQueries({ queryKey: ['monitoring', 'site-up'] });
    },
  });
};

