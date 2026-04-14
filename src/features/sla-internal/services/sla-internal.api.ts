/**
 * Legacy be-sla-apt1v3: SLA1/SLA2 JSON + SLA3 Excel export
 */

import { slaInternalApiClient } from '@/lib/api';

type LegacyBody<T> = {
  status: string;
  data?: T;
  message?: string;
};

export interface NojsUserRow {
  id: number;
  nojs: string;
  site: string;
  lc?: string;
  provinsi?: string;
  [key: string]: unknown;
}

export type SlaInternalDataSource = 'apt1' | 'apt2' | 'talis5' | 'terestrial';

export async function fetchNojsUsers(dataSource?: SlaInternalDataSource): Promise<NojsUserRow[]> {
  const res = await slaInternalApiClient.get<LegacyBody<NojsUserRow[]>>('/api/nojs', {
    params: dataSource ? { dataSource } : undefined,
  });
  return res.data.data ?? [];
}

export interface Sla1AggregateRow {
  nojs: string;
  site: string;
  lc?: string;
  up_time: string;
  unknown_time: string;
  up_persentase: string;
  unknown_persentase: string;
  eh1: string | number;
  eh2: string | number;
  eh3: string | number;
  batt_volt: string | number;
  edl1: string | number;
  edl2: string | number;
  vsat_curr: string | number;
  bts_curr: string | number;
  watt: string | number;
  duration: string | number;
  secend: string | number;
  [key: string]: unknown;
}

export async function fetchSla1ForLogger(params: {
  loggerId: number;
  start: string;
  end: string;
  dataSource?: SlaInternalDataSource;
}): Promise<Sla1AggregateRow> {
  const res = await slaInternalApiClient.get<LegacyBody<Sla1AggregateRow[]>>('/api/logger/sla', {
    params: {
      nojs: params.loggerId,
      start: params.start,
      end: params.end,
      ...(params.dataSource ? { dataSource: params.dataSource } : {}),
    },
  });
  const row = res.data.data?.[0];
  if (!row) {
    throw new Error('Data SLA 1 kosong untuk site ini');
  }
  return row;
}

export interface Sla2DailyRow {
  nojs: string;
  site: string;
  date: string;
  up_time: string;
  batt_volt: string | number;
  vsat_curr: string | number;
  bts_curr: string | number;
  eh1: string | number;
  eh2: string | number;
  eh3: string | number;
  edl1: string | number;
  edl2: string | number;
  lvd1: string | number;
  lvd2: string | number;
  [key: string]: unknown;
}

export async function fetchSla2ForLogger(params: {
  loggerId: number;
  start: string;
  end: string;
  dataSource?: SlaInternalDataSource;
}): Promise<Sla2DailyRow[]> {
  const res = await slaInternalApiClient.get<LegacyBody<Sla2DailyRow[]>>('/api/logger/sla', {
    params: {
      nojs: params.loggerId,
      start: params.start,
      end: params.end,
      daily: 'true',
      ...(params.dataSource ? { dataSource: params.dataSource } : {}),
    },
  });
  return res.data.data ?? [];
}

export async function fetchSla3ExportBlob(params: {
  loggerId: number;
  nojsCode: string;
  start: string;
  end: string;
  dataSource?: SlaInternalDataSource;
}): Promise<Blob> {
  const res = await slaInternalApiClient.get('/api/export', {
    params: {
      nojs: params.loggerId,
      nojsCode: params.nojsCode,
      start: params.start,
      end: params.end,
      ...(params.dataSource ? { dataSource: params.dataSource } : {}),
    },
    responseType: 'blob',
  });
  return res.data as Blob;
}
