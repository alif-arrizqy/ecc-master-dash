/**
 * Ticketing Types
 * Types untuk Trouble Ticketing System
 */

// Enums
export type TicketStatus = 'progress' | 'pending' | 'closed';

// Core Entities
export interface Ticket {
  ticket_number: string;
  ticket_type_id: number;
  ticket_type?: {
    id: number;
    name: string;
  };
  date_down: string; // YYYY-MM-DD
  status: TicketStatus;
  site_id: string;
  site?: Site;
  sla_avg?: number | null;
  pic_id?: number;
  pic?: {
    id: number;
    name: string;
  };
  plan_cm: string;
  action: string;
  problems?: Problem[];
  contact_persons?: ContactPerson[];
  created_at?: string;
  updated_at?: string;
  duration_down?: number; // calculated: today - date_down
}

export interface TicketType {
  id: number;
  name: string;
}

export interface Problem {
  id: number;
  name: string;
}

export interface PIC {
  id: number;
  name: string;
}

export interface Site {
  id?: number;
  site_id: string;
  site_name: string;
  battery_version?: string;
  province?: string;
  pr_code?: string | null;
  contact_person?: ContactPerson[];
}

export interface ContactPerson {
  id?: number;
  name: string;
  phone?: string;
}

export interface SLAData {
  siteId: string;
  sla_avg?: number | null;
  period?: string;
}

export interface ProgressHistory {
  id?: number;
  date: string; // YYYY-MM-DD
  action: string;
  created_at?: string;
  updated_at?: string;
}

// Form Data Types
export interface CreateTicketFormData {
  ticket_type_id: number;
  date_down: string; // YYYY-MM-DD
  site_id: string;
  problem_ids: number[]; // Array of selected problem IDs
  plan_cm: string;
  pic_id: number;
  action: string;
  sla_avg?: number | null; // Read-only, not sent to API
}

export interface EditTicketFormData {
  ticket_type_id: number;
  date_down: string; // YYYY-MM-DD
  site_id: string;
  problem_ids: number[];
  pic_id: number;
  plan_cm: string;
  action: string;
}

export interface AddProgressFormData {
  date: string; // YYYY-MM-DD
  action: string;
}

export interface CloseTicketFormData {
  date: string; // YYYY-MM-DD
  action: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter Types
export interface TicketFilterParams {
  page?: number;
  perPage?: number;
  status?: TicketStatus | '';
  ticketType?: number | '';
  siteId?: string;
  siteName?: string;
  fromDate?: string;
  toDate?: string;
}

// Type guards and utilities
export const isValidTicketStatus = (status: unknown): status is TicketStatus => {
  return status === 'progress' || status === 'pending' || status === 'closed';
};

export const ticketStatusLabels: Record<TicketStatus, string> = {
  progress: 'In Progress',
  pending: 'Pending',
  closed: 'Closed',
};

export const ticketStatusColors: Record<TicketStatus, 'info' | 'warning' | 'secondary'> = {
  progress: 'info',
  pending: 'warning',
  closed: 'secondary',
};

// SLA color determination function
export const getSLAColor = (slaValue?: number | null): 'success' | 'warning' | 'destructive' | 'secondary' => {
  if (slaValue === null || slaValue === undefined || slaValue === 0) {
    return 'secondary'; // Gray
  }
  if (slaValue >= 95.5) {
    return 'success'; // Green
  }
  if (slaValue >= 70) {
    return 'warning'; // Yellow
  }
  return 'destructive'; // Red
};

export const getSLAColorHex = (slaValue?: number | null): string => {
  if (slaValue === null || slaValue === undefined || slaValue === 0) {
    return '#6c757d'; // Gray
  }
  if (slaValue >= 95.5) {
    return '#28a745'; // Green
  }
  if (slaValue >= 70) {
    return '#ffc107'; // Yellow
  }
  return '#dc3544'; // Red
};
