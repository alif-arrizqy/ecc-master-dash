/**
 * React Query hooks for SLA Dashboard API endpoints
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { slaApi, BatteryVersion } from '@/lib/api';
import {
  DailySLAChartData,
  WeeklySLAChartData,
  MonthlyReportSummary,
  SLAReason,
  GAMASHistoryItem,
  PaginationInfo,
  SLAReportDetail,
  SiteMaster,
  PotensiSPSitesResponse,
} from '@/types/api';
import { DailySLA, WeeklySLA } from '@/data/mockData';

/**
 * Transform API date-value format to chart day-sla format
 */
function transformChartData(apiData: DailySLAChartData[]): DailySLA[] {
  return apiData.map((item) => {
    // Extract day from date string (YYYY-MM-DD)
    const day = parseInt(item.date.split('-')[2], 10);
    return {
      day,
      sla: item.value,
    };
  });
}

/**
 * Hook: Get daily SLA chart data per battery version
 */
export function useDailySLAChartByBatteryVersion(
  batteryVersion: BatteryVersion,
  params: { startDate: string; endDate: string },
  options?: Omit<UseQueryOptions<DailySLA[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DailySLA[], Error>({
    queryKey: ['dailySLAChart', batteryVersion, params.startDate, params.endDate],
    queryFn: async () => {
      const data = await slaApi.getDailySLAChartByBatteryVersion(batteryVersion, params);
      return transformChartData(data);
    },
    ...options,
  });
}

/**
 * Hook: Get daily average SLA chart data for all sites
 */
export function useDailySLAChartAllSites(
  params: { startDate: string; endDate: string },
  options?: Omit<UseQueryOptions<DailySLA[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<DailySLA[], Error>({
    queryKey: ['dailySLAChartAllSites', params.startDate, params.endDate],
    queryFn: async () => {
      const data = await slaApi.getDailySLAChartAllSites(params);
      return transformChartData(data);
    },
    ...options,
  });
}

/**
 * Hook: Get monthly report summary
 */
export function useMonthlyReportSummary(
  period: string,
  options?: Omit<UseQueryOptions<MonthlyReportSummary, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<MonthlyReportSummary, Error>({
    queryKey: ['monthlyReportSummary', period],
    queryFn: () => slaApi.getMonthlyReportSummary(period),
    ...options,
  });
}

/**
 * Hook: Get SLA reasons for battery version
 */
export function useSLAReasons(
  batteryVersion: BatteryVersion,
  options?: Omit<UseQueryOptions<SLAReason[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SLAReason[], Error>({
    queryKey: ['slaReasons', batteryVersion],
    queryFn: () => slaApi.getSLAReasons(batteryVersion),
    ...options,
  });
}

/**
 * Hook: Get weekly SLA chart data for all sites
 */
export function useWeeklySLAChartAllSites(
  params: { startDate: string; endDate: string },
  options?: Omit<UseQueryOptions<WeeklySLA[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<WeeklySLA[], Error>({
    queryKey: ['weeklySLAChartAllSites', params.startDate, params.endDate],
    queryFn: async () => {
      const data = await slaApi.getWeeklySLAChartAllSites(params);
      // Transform API format (name, value) to chart format (week, sla)
      return data.map((item) => ({
        week: item.name,
        sla: item.value,
      }));
    },
    ...options,
  });
}

/**
 * Hook: Get GAMAS history with pagination
 */
export function useGAMASHistory(
  params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  },
  options?: Omit<UseQueryOptions<{ data: GAMASHistoryItem[]; pagination?: PaginationInfo }, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<{ data: GAMASHistoryItem[]; pagination?: PaginationInfo }, Error>({
    queryKey: ['gamasHistory', params.startDate, params.endDate, params.page, params.limit],
    queryFn: () => slaApi.getGAMASHistory(params),
    ...options,
  });
}

/**
 * Hook: Get detailed SLA report
 */
export function useSLAReportDetail(
  params: { startDate: string; endDate: string },
  options?: Omit<UseQueryOptions<SLAReportDetail, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SLAReportDetail, Error>({
    queryKey: ['slaReportDetail', params.startDate, params.endDate],
    queryFn: () => slaApi.getSLAReportDetail(params),
    ...options,
  });
}

/**
 * Hook: Get sites with Potensi SP status
 */
export function usePotensiSPSites(
  params: {
    startDate: string;
    endDate: string;
    statusSP: string;
    page?: number;
    limit?: number;
  },
  options?: Omit<UseQueryOptions<PotensiSPSitesResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PotensiSPSitesResponse, Error>({
    queryKey: ['potensiSPSites', params.startDate, params.endDate, params.statusSP, params.page, params.limit],
    queryFn: () => slaApi.getPotensiSPSites(params),
    ...options,
  });
}

