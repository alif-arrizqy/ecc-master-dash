import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { uptimeLoggersApi } from '../services/uptime-loggers.api';
import type { UptimeSummary, SiteItem, PullingLogsSummary, PullingLogItem, Pagination } from '../services/uptime-loggers.api';

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
