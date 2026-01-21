/**
 * Shipping Types
 * Types untuk Shipping Spare Part dan Retur Spare Part
 */

export interface ShippingSparePart {
  id: number;
  date: string;
  site?: {
    site_id: string;
    site_name?: string;
    pr_code?: string | null;
  };
  address?: {
    address_id: number;
    province?: string;
    cluster?: string;
    address_shipping?: string;
  };
  sparepart_note?: string;
  problem?: {
    problem_id: number;
    problem_name?: string;
  };
  ticket?: {
    ticket_number?: string;
    ticket_image?: string;
  };
  resi?: {
    resi_number?: string;
    resi_image?: string;
  };
  status: 'request gudang' | 'proses kirim' | 'selesai' | 'REQUEST_GUDANG' | 'PROSES_KIRIM' | 'SELESAI';
  created_at?: string;
  updated_at?: string;
}

export interface ReturSparePart {
  id: number;
  date: string;
  shipper: string;
  source_spare_part: string;
  list_spare_part?: string | Array<unknown>; // JSON field, bisa string atau array
  image?: string | Array<string>; // JSON field, bisa string atau array of image URLs
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Address {
  id: number;
  province?: string;
  cluster?: string;
  address_shipping?: string;
  [key: string]: unknown;
}

export interface ProblemMaster {
  id: number;
  problem_name?: string;
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
  resi_number?: string;
  resi_image?: File | null;
  status: 'request gudang' | 'proses kirim' | 'selesai';
  pr_code?: string;
}

export interface ReturSparePartFormData {
  date: string;
  shipper: string;
  source_spare_part: string;
  list_spare_part?: string;
  image?: File | null;
  notes?: string;
}

