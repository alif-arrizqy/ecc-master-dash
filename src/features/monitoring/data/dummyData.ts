/**
 * Dummy Data untuk Monitoring
 * Data hardcode untuk testing layout halaman monitoring
 */

import { SiteDown, SiteUp, MonitoringSummary, MonitoringPagination } from '../types/monitoring.types';

// Dummy Summary Data
export const dummySummary: MonitoringSummary = {
  totalSites: 150,
  totalSitesDown: 20,
  totalSitesUp: 130,
  percentageSitesDown: 13.3,
  percentageSitesUp: 86.7,
};

// Dummy Site Down Data
export const dummySiteDownData: SiteDown[] = [
  {
    id: 1,
    siteId: 'SITE-001',
    siteName: 'Site Jakarta Pusat',
    downSince: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari lalu
    downSeconds: 172800, // 2 hari
    slaAvg: 92.5,
    statusSLA: 'Fair',
    statusSP: 'Potensi SP',
    problem: ['Power outage', 'Battery low'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    siteId: 'SITE-002',
    siteName: 'Site Bandung Utara',
    downSince: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 jam lalu
    downSeconds: 18000, // 5 jam
    slaAvg: 96.8,
    statusSLA: 'Meet SLA',
    statusSP: 'Clear SP',
    problem: [],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    siteId: 'SITE-003',
    siteName: 'Site Surabaya Selatan',
    downSince: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 hari lalu
    downSeconds: 864000, // 10 hari
    slaAvg: 75.2,
    statusSLA: 'Very Bad',
    statusSP: 'Potensi SP',
    problem: ['Network issue', 'Hardware failure', 'Maintenance overdue'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    siteId: 'SITE-004',
    siteName: 'Site Yogyakarta',
    downSince: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 menit lalu
    downSeconds: 1800, // 30 menit
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    siteId: 'SITE-005',
    siteName: 'Site Medan Timur',
    downSince: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 hari lalu
    downSeconds: 691200, // 8 hari
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    siteId: 'SITE-006',
    siteName: 'Site Makassar',
    downSince: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 hari lalu
    downSeconds: 86400, // 1 hari
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    siteId: 'SITE-007',
    siteName: 'Site Semarang',
    downSince: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 jam lalu
    downSeconds: 10800, // 3 jam
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    siteId: 'SITE-008',
    siteName: 'Site Palembang',
    downSince: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 hari lalu
    downSeconds: 1296000, // 15 hari
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 9,
    siteId: 'SITE-009',
    siteName: 'Site Denpasar',
    downSince: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 menit lalu
    downSeconds: 2700, // 45 menit
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 10,
    siteId: 'SITE-010',
    siteName: 'Site Malang',
    downSince: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 hari lalu
    downSeconds: 518400, // 6 hari
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 11,
    siteId: 'SITE-011',
    siteName: 'Site Solo',
    downSince: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 jam lalu
    downSeconds: 7200, // 2 jam
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 12,
    siteId: 'SITE-012',
    siteName: 'Site Padang',
    downSince: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 hari lalu
    downSeconds: 1728000, // 20 hari
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 13,
    siteId: 'SITE-013',
    siteName: 'Site Bekasi',
    downSince: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 hari lalu
    downSeconds: 345600, // 4 hari
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 14,
    siteId: 'SITE-014',
    siteName: 'Site Batam',
    downSince: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 jam lalu
    downSeconds: 43200, // 12 jam
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 15,
    siteId: 'SITE-015',
    siteName: 'Site Pekanbaru',
    downSince: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), // 9 hari lalu
    downSeconds: 777600, // 9 hari
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 16,
    siteId: 'SITE-016',
    siteName: 'Site Pontianak',
    downSince: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 jam lalu
    downSeconds: 3600, // 1 jam
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 17,
    siteId: 'SITE-017',
    siteName: 'Site Banjarmasin',
    downSince: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari lalu
    downSeconds: 604800, // 7 hari
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 18,
    siteId: 'SITE-018',
    siteName: 'Site Manado',
    downSince: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 menit lalu
    downSeconds: 900, // 15 menit
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 19,
    siteId: 'SITE-019',
    siteName: 'Site Balikpapan',
    downSince: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(), // 11 hari lalu
    downSeconds: 950400, // 11 hari
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 20,
    siteId: 'SITE-020',
    siteName: 'Site Samarinda',
    downSince: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 hari lalu
    downSeconds: 259200, // 3 hari
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Dummy Site Up Data
export const dummySiteUpData: SiteUp[] = [
  {
    id: 1,
    siteId: 'SITE-101',
    siteName: 'Site Jakarta Selatan',
    slaAvg: 97.5,
    statusSLA: 'Meet SLA',
    problem: [],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    siteId: 'SITE-102',
    siteName: 'Site Bandung Selatan',
    slaAvg: 88.3,
    statusSLA: 'Bad',
    problem: ['Minor issue'],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    siteId: 'SITE-103',
    siteName: 'Site Surabaya Utara',
    slaAvg: 94.2,
    statusSLA: 'Fair',
    problem: [],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 4,
    siteId: 'SITE-104',
    siteName: 'Site Yogyakarta Utara',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 5,
    siteId: 'SITE-105',
    siteName: 'Site Medan Barat',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 6,
    siteId: 'SITE-106',
    siteName: 'Site Makassar Utara',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 7,
    siteId: 'SITE-107',
    siteName: 'Site Semarang Utara',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 8,
    siteId: 'SITE-108',
    siteName: 'Site Palembang Selatan',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 9,
    siteId: 'SITE-109',
    siteName: 'Site Denpasar Utara',
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 10,
    siteId: 'SITE-110',
    siteName: 'Site Malang Utara',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 11,
    siteId: 'SITE-111',
    siteName: 'Site Solo Utara',
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 12,
    siteId: 'SITE-112',
    siteName: 'Site Padang Utara',
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 13,
    siteId: 'SITE-113',
    siteName: 'Site Bogor',
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 14,
    siteId: 'SITE-114',
    siteName: 'Site Depok',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 15,
    siteId: 'SITE-115',
    siteName: 'Site Tangerang',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 16,
    siteId: 'SITE-116',
    siteName: 'Site Bekasi Utara',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 17,
    siteId: 'SITE-117',
    siteName: 'Site Batam Utara',
    createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 18,
    siteId: 'SITE-118',
    siteName: 'Site Pekanbaru Utara',
    createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 19,
    siteId: 'SITE-119',
    siteName: 'Site Pontianak Utara',
    createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 20,
    siteId: 'SITE-120',
    siteName: 'Site Banjarmasin Utara',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Dummy Pagination
export const dummyPagination: MonitoringPagination = {
  page: 1,
  limit: 5,
  total: 20,
  totalPages: 4,
};

export const dummySiteUpPagination: MonitoringPagination = {
  page: 1,
  limit: 5,
  total: 20,
  totalPages: 4,
};

