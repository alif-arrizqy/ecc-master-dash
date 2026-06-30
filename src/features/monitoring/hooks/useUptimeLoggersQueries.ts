import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { uptimeLoggersApi } from '../services/uptime-loggers.api';
import { sitesApi } from '@/shared/lib/api';
import type { UptimeSummary, SiteItem, PullingLogsSummary, PullingLogItem, Pagination } from '../services/uptime-loggers.api';

export type SiteCoord = { lat: number; lng: number };

/**
 * Fetch site coordinates from sites-service and index them by uppercased siteId.
 * Used to plot uptime sites on the map.
 */
export function useSiteCoordinates() {
  return useQuery<Map<string, SiteCoord>>({
    queryKey: ['site-coordinates'],
    queryFn: async () => {
      // ponytail: sites-service caps limit at 100 (currently ~81 active sites).
      // Paginate here only if active sites ever exceed 100.
      const { data } = await sitesApi.getSites({ limit: 100, isActive: true });
      const map = new Map<string, SiteCoord>();
      for (const raw of data as Array<{ siteId?: string; detail?: { latitude?: string; longitude?: string } }>) {
        const lat = Number(raw.detail?.latitude);
        const lng = Number(raw.detail?.longitude);
        if (raw.siteId && Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
          map.set(raw.siteId.toUpperCase(), { lat, lng });
        }
      }
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUptimeSummary(date?: string) {
  return useQuery<UptimeSummary>({
    queryKey: ['uptime-summary', date],
    queryFn: () => uptimeLoggersApi.getUptimeSummary(date),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUptimeSites(
  params: {
    date?: string;
    batteryType?: string;
    search?: string;
    uptimeHealth?: string;
  },
  options?: { enabled?: boolean },
) {
  return useQuery<SiteItem[]>({
    queryKey: ['uptime-sites', params],
    queryFn: () => uptimeLoggersApi.getUptimeSites(params),
    staleTime: 30_000,
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
}

export function usePullingLogsSummary(date?: string) {
  return useQuery<PullingLogsSummary>({
    queryKey: ['pulling-logs-summary', date],
    queryFn: () => uptimeLoggersApi.getPullingLogsSummary(date),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function usePullingLogs(params: {
  date?: string;
  batteryType?: string;
  result?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery<{ items: PullingLogItem[]; pagination: Pagination }>({
    queryKey: ['pulling-logs', params],
    queryFn: () => uptimeLoggersApi.getPullingLogs(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
