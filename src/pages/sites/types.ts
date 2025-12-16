/**
 * Types and interfaces for Sites Management
 */

export interface SiteDetail {
  village?: string | null;
  subdistrict?: string | null;
  regency?: string | null;
  province?: string;
  longitude?: string;
  latitude?: string;
  ipGatewayGs?: string | null;
  ipGatewayLc?: string | null;
  subnet?: string;
  batteryList?: unknown[];
  cabinetList?: unknown[];
  buildYear?: string;
  projectPhase?: string;
  onairDate?: string | null;
  gsSustainDate?: string | null;
  topoSustainDate?: string | null;
  talisInstalled?: string | null;
  providerGs?: string;
  beamProvider?: string;
  cellularOperator?: string;
  contactPerson?: Array<{ name: string; phone: string | null }>;
}

export interface Site {
  prCode?: string | null;
  siteId: string;
  clusterId?: string | null;
  terminalId?: string;
  siteName: string;
  ipSite?: string | null;
  ipSnmp?: string | null;
  ipMiniPc?: string | null;
  webappUrl?: string;
  ehubVersion?: string;
  panel2Type?: string;
  sccType?: string;
  batteryVersion?: string;
  totalBattery?: number;
  statusSites?: string;
  isActive?: boolean;
  detail?: SiteDetail;
  [key: string]: unknown;
}

export interface SiteFormData {
  siteId?: string;
  siteName?: string;
  ipSnmp?: string;
  sccType?: string;
  batteryVersion?: string;
  totalBattery?: number;
  statusSites?: string;
  webappUrl?: string;
  detail?: {
    province?: string;
    talisInstalled?: string;
  };
  [key: string]: unknown;
}

export interface SiteQueryParams {
  page?: number;
  limit?: number;
  search?: string; // Search in siteName, siteId, or prCode
  isActive?: boolean;
  sortBy?: string; // siteName, siteId, createdAt, updatedAt
  sortOrder?: string; // asc, desc
  status?: string; // terestrial, non_terestrial, non-terestrial
  province?: string; // province name or region (papua/maluku)
  sccType?: string; // scc_srne, scc_epever, scc-srne, scc-epever
  batteryVersion?: string; // talis5, mix, jspro
  siteId?: string; // Exact match for siteId (takes priority over search)
  prCode?: string; // Exact match for prCode (takes priority over search)
}

