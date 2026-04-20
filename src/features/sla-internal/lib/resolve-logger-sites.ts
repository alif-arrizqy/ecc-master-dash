import type { Site } from '@/features/sites/types';
import { sitesApi } from '@/shared/lib/api';
import { fetchNojsUsers, type SlaInternalDataSource } from '../services/sla-internal.api';

export type SlaInternalBattery = 'JSPRO' | 'TALIS5';

/** Filter `status` pada GET /api/v1/sites/ (sites-services). */
export type SlaInternalStatusSitesFilter = 'all' | 'terestrial' | 'non_terestrial';

export function batteryToSitesApiParam(b: SlaInternalBattery): string {
  return b === 'JSPRO' ? 'jspro' : 'talis5';
}

export interface ResolvedLoggerSite {
  loggerId: number;
  nojsCode: string;
  siteName: string;
  siteId: string;
  dataSource?: SlaInternalDataSource;
  label: string;
}

const SOURCE_LABEL: Record<SlaInternalDataSource, string> = {
  apt1: 'APT1',
  apt2: 'APT2',
  talis5: 'TALIS5',
  terestrial: 'TERESTRIAL',
};

function normalizeNojs(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

function statusToApiParam(
  status: SlaInternalStatusSitesFilter
): string | undefined {
  if (status === 'all') return undefined;
  return status;
}

function batteryVersionsForSla(battery: SlaInternalBattery): string[] {
  return battery === 'JSPRO' ? ['jspro'] : ['talis5', 'mix'];
}

async function fetchAllSitesOneBatteryVersion(
  batteryVersion: string,
  status: SlaInternalStatusSitesFilter
): Promise<Site[]> {
  const statusParam = statusToApiParam(status);
  const first = await sitesApi.getSites({
    batteryVersion,
    limit: 100,
    page: 1,
    isActive: true,
    sortBy: 'siteName',
    sortOrder: 'asc',
    ...(statusParam ? { status: statusParam } : {}),
  });

  let sites = (first.data as Site[]) ?? [];
  const totalPages = first.pagination?.totalPages ?? 1;

  if (totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        sitesApi.getSites({
          batteryVersion,
          limit: 100,
          page: i + 2,
          isActive: true,
          sortBy: 'siteName',
          sortOrder: 'asc',
          ...(statusParam ? { status: statusParam } : {}),
        })
      )
    );
    for (const p of pages) {
      sites = sites.concat((p.data as Site[]) ?? []);
    }
  }

  const byId = new Map<string, Site>();
  for (const s of sites) {
    if (!byId.has(s.siteId)) byId.set(s.siteId, s);
  }
  return Array.from(byId.values());
}

/** Master sites: TALIS5 menggabungkan baris battery `talis5` dan `mix` dari sites-services. */
async function fetchMasterSitesForBattery(
  battery: SlaInternalBattery,
  statusSites: SlaInternalStatusSitesFilter
): Promise<Site[]> {
  const versions = batteryVersionsForSla(battery);
  const merged: Site[] = [];
  for (const v of versions) {
    merged.push(...(await fetchAllSitesOneBatteryVersion(v, statusSites)));
  }
  const byId = new Map<string, Site>();
  for (const s of merged) {
    if (!byId.has(s.siteId)) byId.set(s.siteId, s);
  }
  return Array.from(byId.values());
}

/**
 * Gabungkan master Sites (filter battery + status terestrial) dengan baris `/api/nojs` (id logger dipakai di query SLA).
 */
export async function resolveLoggerSites(
  battery: SlaInternalBattery,
  options?: { statusSites?: SlaInternalStatusSitesFilter }
): Promise<ResolvedLoggerSite[]> {
  const statusSites = options?.statusSites ?? 'all';
  // Untuk TALIS5+MIX tidak ada dataSource khusus di sla-internal-services.
  // Jadi untuk TALIS/MIX semua endpoint dipanggil tanpa query param `dataSource`.
  const sources: Array<{ label: string; dataSource?: SlaInternalDataSource }> =
    battery === 'JSPRO'
      ? [
          { label: SOURCE_LABEL.apt1, dataSource: 'apt1' },
          { label: SOURCE_LABEL.apt2, dataSource: 'apt2' },
        ]
      : [{ label: 'TALIS/MIX' }];
  const [sites, sourceRows] = await Promise.all([
    fetchMasterSitesForBattery(battery, statusSites),
    Promise.all(
      sources.map(async (source) => {
        try {
          const rows = await fetchNojsUsers(source.dataSource);
          return { source, rows };
        } catch {
          return { source, rows: [] };
        }
      })
    ),
  ]);

  const resolved: ResolvedLoggerSite[] = [];

  for (const { source, rows } of sourceRows) {
    const rowByNojs = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      const key = normalizeNojs(row.nojs);
      if (key) rowByNojs.set(key, row);
    }
    for (const site of sites) {
      const siteNojs = normalizeNojs(site.noJS);
      const siteIdAsFallback = normalizeNojs(site.siteId);
      const row = rowByNojs.get(siteNojs) ?? rowByNojs.get(siteIdAsFallback);
      if (row && typeof row.id === 'number') {
        const identifier = String(row.nojs);
        const resolvedSiteName = String(row.site || site.siteName);
        resolved.push({
          loggerId: row.id,
          nojsCode: String(row.nojs),
          siteName: resolvedSiteName,
          siteId: site.siteId,
          dataSource: source.dataSource,
          label: `${source.label} - (${identifier}) - ${resolvedSiteName}`,
        });
      }
    }
  }

  return resolved.sort((a, b) => a.label.localeCompare(b.label, 'id'));
}
