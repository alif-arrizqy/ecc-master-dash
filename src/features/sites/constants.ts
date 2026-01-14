/**
 * Constants for Sites Management
 */

import type { BatteryVersion } from '@/shared/lib/api';

export const PROVINCES = [
  'MALUKU',
  'MALUKU UTARA',
  'PAPUA BARAT',
  'PAPUA BARAT DAYA',
  'PAPUA SELATAN',
] as const;

export const STATUS_OPTIONS = [
  { value: 'terestrial', label: 'Terestrial' },
  { value: 'non_terestrial', label: 'Non Terestrial' },
] as const;

export const SCC_TYPES = [
  { value: 'scc_srne', label: 'SCC SRNE' },
  { value: 'scc_epever', label: 'SCC EPEVER' },
] as const;

export const BATTERY_VERSIONS: { value: BatteryVersion; label: string }[] = [
  { value: 'talis5', label: 'Talis5 Full' },
  { value: 'mix', label: 'Talis5 Mix' },
  { value: 'jspro', label: 'JS PRO' },
];

export const EHUB_VERSIONS = [
  { value: 'new', label: 'New' },
  { value: 'old', label: 'Old' },
] as const;

export const PANEL2_TYPES = [
  { value: 'new', label: 'New' },
  { value: 'old', label: 'Old' },
] as const;

export const ITEMS_PER_PAGE = 20;

