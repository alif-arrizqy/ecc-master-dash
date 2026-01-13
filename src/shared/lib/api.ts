/**
 * Shared API Clients
 * Export base API clients untuk digunakan oleh feature modules
 */

// Re-export base clients dari lib/api.ts
export { slaApiClient, sitesApiClient, monitoringApiClient } from '@/lib/api';
export type { BatteryVersion } from '@/lib/api';

// Sites API akan di-export sebagai shared service nanti
// Untuk sementara, import dari lib/api.ts

