// Mock data for SLA Dashboard

export interface Problem {
  id: string;
  siteId: string;
  date: string;
  pic: 'VSAT' | 'SNMP' | 'Power' | 'Other';
  problem: string;
  notes: string;
}

export interface Site {
  id: string;
  siteName: string;
  province: string;
  batteryVersion: 'Talis5 Full' | 'Talis5 Mix' | 'JS PRO';
  installDate: string;
  slaAvg: number;
  status: 'Potensi SP' | 'Clear SP';
  dailySla: { day: number; sla: number }[];
}

// Legacy interface for compatibility
export interface SLARecord {
  id: string;
  siteName: string;
  batteryVersion: 'Talis5 Full' | 'Talis5 Mix' | 'JS PRO';
  province: string;
  date: string;
  sla: number;
}

export interface DailySLA {
  day: number;
  date?: string; // Format: YYYY-MM-DD
  sla: number;
}

export interface WeeklySLA {
  week: string;
  sla: number;
}

export interface SLACause {
  batteryVersion: string;
  cause: string;
}

export interface GAMASHistory {
  date: string;
  description: string;
  affectedSites: number;
}

// Summary data
export const summaryData = {
  talis5Full: { totalSites: 25, avgSLA: 97.8 },
  talis5Mix: { totalSites: 30, avgSLA: 94.2 },
  jsPro: { totalSites: 25, avgSLA: 96.5 },
  total: { totalSites: 80, avgSLA: 96.1 },
};

// Daily SLA data for current month
export const generateDailySLA = (): DailySLA[] => {
  const days = [];
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  
  // Get the number of days in the current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      day: i,
      date: date.toISOString().split('T')[0], // Format: YYYY-MM-DD
      sla: 85 + Math.random() * 15,
    });
  }
  return days;
};

export const dailySLAAllSite = generateDailySLA();
export const dailySLATalis5Full = generateDailySLA();
export const dailySLATalis5Mix = generateDailySLA();
export const dailySLAJSPro = generateDailySLA();

// Weekly trend data
export const weeklyTrendData: WeeklySLA[] = [
  { week: 'Minggu 1', sla: 95.2 },
  { week: 'Minggu 2', sla: 96.8 },
  { week: 'Minggu 3', sla: 94.5 },
  { week: 'Minggu 4', sla: 97.1 },
];

// SLA causes
export const slaCauses: SLACause[] = [
  { batteryVersion: 'Talis5 Full', cause: 'SNMP DOWN' },
  { batteryVersion: 'Talis5 Mix', cause: 'Problem VSAT, SNMP DOWN' },
  { batteryVersion: 'JS PRO', cause: 'Insiden terbakar, Problem VSAT' },
];

// GAMAS History
export const gamasHistory: GAMASHistory[] = [
  { date: '2024-12-05', description: 'Gangguan jaringan backbone regional', affectedSites: 12 },
  { date: '2024-12-02', description: 'Pemeliharaan sistem terjadwal', affectedSites: 8 },
];

// Province list
export const provinces = [
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'DKI Jakarta',
  'Banten',
  'Sumatera Utara',
  'Sumatera Selatan',
  'Kalimantan Timur',
  'Sulawesi Selatan',
  'Bali',
];

// PIC types
export const picTypes: Problem['pic'][] = ['VSAT', 'SNMP', 'Power', 'Other'];

// Problem descriptions
const problemDescriptions = [
  'VSAT up/down',
  'SNMP down',
  'Power outage',
  'Battery low',
  'Connection timeout',
  'Signal interference',
  'Hardware failure',
  'Software crash',
];

const problemNotes = [
  'kondisi tidak stabil',
  'done restart',
  'menunggu spare part',
  'sudah normal',
  'perlu pengecekan lanjut',
  'koordinasi dengan vendor',
  'dijadwalkan maintenance',
  'escalation ke L2',
];

// Generate sites
export const generateSites = (count: number): Site[] => {
  const batteryVersions: Site['batteryVersion'][] = ['Talis5 Full', 'Talis5 Mix', 'JS PRO'];
  const sites: Site[] = [];

  for (let i = 0; i < count; i++) {
    const batteryVersion = batteryVersions[i % 3];
    const slaAvg = 80 + Math.random() * 20;
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const dailySla = Array.from({ length: daysInMonth }, (_, day) => {
      const date = new Date(year, month, day + 1);
      return {
        day: day + 1,
        date: date.toISOString().split('T')[0],
        sla: 80 + Math.random() * 20,
      };
    });

    sites.push({
      id: `site-${i + 1}`,
      siteName: `Site ${String(i + 1).padStart(3, '0')}`,
      province: provinces[Math.floor(Math.random() * provinces.length)],
      batteryVersion,
      installDate: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      slaAvg,
      status: slaAvg < 95.5 ? 'Potensi SP' : 'Clear SP',
      dailySla,
    });
  }

  return sites;
};

// Generate problems for sites
export const generateProblems = (sites: Site[]): Problem[] => {
  const problems: Problem[] = [];
  let problemId = 1;

  sites.forEach((site) => {
    // Only sites with low SLA have problems
    if (site.slaAvg < 95.5) {
      const problemCount = Math.floor(Math.random() * 4) + 1; // 1-4 problems per site
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let i = 0; i < problemCount; i++) {
        problems.push({
          id: `problem-${problemId++}`,
          siteId: site.id,
          date: new Date(year, month, Math.floor(Math.random() * daysInMonth) + 1).toISOString().split('T')[0],
          pic: picTypes[Math.floor(Math.random() * picTypes.length)],
          problem: problemDescriptions[Math.floor(Math.random() * problemDescriptions.length)],
          notes: problemNotes[Math.floor(Math.random() * problemNotes.length)],
        });
      }
    }
  });

  return problems;
};

export const sites = generateSites(80);
export const problems = generateProblems(sites);

// Helper function to get problems for a site
export const getProblemsForSite = (siteId: string): Problem[] => {
  return problems.filter((p) => p.siteId === siteId);
};

// Legacy: Generate mock SLA records for compatibility
export const generateSLARecords = (count: number): SLARecord[] => {
  const batteryVersions: SLARecord['batteryVersion'][] = ['Talis5 Full', 'Talis5 Mix', 'JS PRO'];
  const records: SLARecord[] = [];

  for (let i = 0; i < count; i++) {
    const batteryVersion = batteryVersions[i % 3];
    records.push({
      id: `site-${i + 1}`,
      siteName: `Site ${String(i + 1).padStart(3, '0')}`,
      batteryVersion,
      province: provinces[Math.floor(Math.random() * provinces.length)],
      date: new Date(2024, 11, Math.floor(Math.random() * 31) + 1).toISOString().split('T')[0],
      sla: 80 + Math.random() * 20,
    });
  }

  return records;
};

export const slaRecords = generateSLARecords(80);

