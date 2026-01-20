/**
 * React Query hooks untuk Dashboard Module
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';
import type { BatteryVersion } from '@/lib/api';
import {
  DailySLAChartData,
  WeeklySLAChartData,
  MonthlyReportSummary,
  SLAReason,
  GAMASHistoryItem,
  PaginationInfo,
  SLAReportDetail,
} from '@/shared/types/api';
import { DailySLA, WeeklySLA } from '@/shared/data/mockData';

/**
 * Transform API date-value format to chart day-sla format
 */
function transformChartData(apiData: DailySLAChartData[]): DailySLA[] {
  return apiData.map((item) => {
    // Extract day from date string (YYYY-MM-DD)
    const day = parseInt(item.date.split('-')[2], 10);
    return {
      day,
      date: item.date, // Keep the full date for formatting
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
    queryKey: ['dashboard', 'dailySLAChart', batteryVersion, params.startDate, params.endDate],
    queryFn: async () => {
      const data = await dashboardApi.getDailySLAChartByBatteryVersion(batteryVersion, params);
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
    queryKey: ['dashboard', 'dailySLAChartAllSites', params.startDate, params.endDate],
    queryFn: async () => {
      const data = await dashboardApi.getDailySLAChartAllSites(params);
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
    queryKey: ['dashboard', 'monthlyReportSummary', period],
    queryFn: () => dashboardApi.getMonthlyReportSummary(period),
    ...options,
  });
}

/**
 * Hook: Get SLA reasons for battery version
 */
export function useSLAReasons(
  batteryVersion: BatteryVersion,
  params?: { startDate?: string; endDate?: string },
  options?: Omit<UseQueryOptions<SLAReason[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<SLAReason[], Error>({
    queryKey: ['dashboard', 'slaReasons', batteryVersion, params?.startDate, params?.endDate],
    queryFn: () => dashboardApi.getSLAReasonsByBatteryVersion(batteryVersion, params),
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
    queryKey: ['dashboard', 'weeklySLAChartAllSites', params.startDate, params.endDate],
    queryFn: async () => {
      const data = await dashboardApi.getWeeklySLAChartAllSites(params);
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
    queryKey: ['dashboard', 'gamasHistory', params.startDate, params.endDate, params.page, params.limit],
    queryFn: () => dashboardApi.getGAMASHistory(params),
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
    queryKey: ['dashboard', 'slaReportDetail', params.startDate, params.endDate],
    queryFn: async () => dashboardApi.getSLAReportDetail(params) as unknown as SLAReportDetail,
    ...options,
  });
}

