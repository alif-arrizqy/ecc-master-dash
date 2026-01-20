/**
 * Shipping Types
 * Types untuk Shipping Spare Part dan Retur Spare Part
 */

export interface ShippingSparePart {
  id: number;
  date: string;
  site_id: string;
  site_name?: string;
  address_id?: number;
  address?: Address;
  sparepart_note?: string;
  problem_id?: number;
  problem?: ProblemMaster;
  ticket_number?: string;
  ticket_image?: string;
  resi_image?: string;
  status: 'request gudang' | 'proses kirim' | 'selesai';
  pr_code?: string;
  cluster?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReturSparePart {
  id: number;
  [key: string]: unknown; // Sesuaikan dengan struktur table return_spare_part
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id: number;
  address?: string;
  cluster?: string;
  [key: string]: unknown;
}

export interface ProblemMaster {
  id: number;
  problem?: string;
  [key: string]: unknown;
}

export interface Site {
  id?: number;
  site_id: string;
  site_name: string;
  province?: string;
}

export interface ShippingStatistics {
  total_shipping?: number;
  request_gudang?: number;
  proses_kirim?: number;
  selesai?: number;
  total_retur?: number;
  [key: string]: unknown;
}

export interface ShippingSparePartFormData {
  date: string;
  site_id: string;
  address_id?: number;
  sparepart_note?: string;
  problem_id?: number;
  problem_new?: string; // Untuk input problem baru
  ticket_number?: string;
  ticket_image?: File | null;
  resi_image?: File | null;
  status: 'request gudang' | 'proses kirim' | 'selesai';
  pr_code?: string;
}

export interface ReturSparePartFormData {
  [key: string]: unknown; // Sesuaikan dengan struktur table return_spare_part
}

