import type { Site } from '@/features/sites/types';
import { sitesApi } from '@/shared/lib/api';
import { fetchNojsUsers } from '../services/sla-internal.api';

export type SlaInternalBattery = 'JSPRO' | 'TALIS5';

export function batteryToSitesApiParam(b: SlaInternalBattery): string {
  return b === 'JSPRO' ? 'jspro' : 'talis5';
}

export interface ResolvedLoggerSite {
  loggerId: number;
  nojsCode: string;
  siteName: string;
  siteId: string;
  label: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function fetchAllSitesForBattery(battery: SlaInternalBattery): Promise<Site[]> {
  const first = await sitesApi.getSites({
    batteryVersion: batteryToSitesApiParam(battery),
    limit: 100,
    page: 1,
    isActive: true,
    sortBy: 'siteName',
    sortOrder: 'asc',
  });

  let sites = (first.data as Site[]) ?? [];
  const totalPages = first.pagination?.totalPages ?? 1;

  if (totalPages > 1) {
    const pages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, i) =>
        sitesApi.getSites({
          batteryVersion: batteryToSitesApiParam(battery),
          limit: 100,
          page: i + 2,
          isActive: true,
          sortBy: 'siteName',
          sortOrder: 'asc',
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

/**
 * Gabungkan master Sites (filter battery) dengan baris `/api/nojs` (id logger dipakai di query SLA).
 */
export async function resolveLoggerSites(battery: SlaInternalBattery): Promise<ResolvedLoggerSite[]> {
  const [nojsRows, sites] = await Promise.all([fetchNojsUsers(), fetchAllSitesForBattery(battery)]);

  const resolved: ResolvedLoggerSite[] = [];

  for (const site of sites) {
    let row = nojsRows.find((n) => String(n.nojs) === String(site.siteId));
    if (!row) {
      row = nojsRows.find((n) => norm(String(n.site)) === norm(site.siteName));
    }
    if (row && typeof row.id === 'number') {
      resolved.push({
        loggerId: row.id,
        nojsCode: String(row.nojs),
        siteName: site.siteName,
        siteId: site.siteId,
        label: `${site.siteName} (${row.nojs})`,
      });
    }
  }

  return resolved.sort((a, b) => a.label.localeCompare(b.label, 'id'));
}
