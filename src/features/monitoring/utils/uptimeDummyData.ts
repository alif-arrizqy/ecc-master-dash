export interface DummySite {
  id: string;
  name: string;
  batteryType: 'jspro' | 'talis5';
  lastUpdatedAt: string;
  uptimePercentage: number;
  uptimeDuration: string;
  batteryVoltage: number;
  pingLatency: number;
}

export interface DummyPullingLog {
  id: string;
  timestamp: string;
  siteName: string;
  batteryType: 'jspro' | 'talis5';
  result: 'success' | 'failed';
  errorMessage?: string;
}

// Generate 81 dummy sites
export const generateDummySites = (): DummySite[] => {
  const sites: DummySite[] = [];
  for (let i = 1; i <= 81; i++) {
    const id = `UXY${i.toString().padStart(3, '0')}`;
    const name = `Site ${id} - Location ${i}`;
    const batteryType = Math.random() > 0.5 ? 'jspro' : 'talis5';
    
    // Randomize uptime to get a mix of healthy, warning, and critical
    const rand = Math.random();
    let uptimePercentage;
    if (rand > 0.3) {
      uptimePercentage = 100;
    } else if (rand > 0.1) {
      uptimePercentage = Math.floor(Math.random() * (99 - 90 + 1)) + 90; // 90-99
    } else {
      uptimePercentage = Math.floor(Math.random() * (70 - 0 + 1)) + 0; // 0-70
    }

    const hours = Math.floor(Math.random() * 720); // up to 30 days
    const minutes = Math.floor(Math.random() * 60);
    const uptimeDuration = `${hours}h ${minutes}m`;

    const batteryVoltage = batteryType === 'jspro' 
      ? +(Math.random() * (54 - 48) + 48).toFixed(1)
      : +(Math.random() * (28 - 24) + 24).toFixed(1);

    const pingLatency = Math.floor(Math.random() * (800 - 20 + 1)) + 20;

    const now = new Date();
    now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60 * 24)); // up to 24 hours ago
    
    sites.push({
      id,
      name,
      batteryType,
      lastUpdatedAt: now.toISOString(),
      uptimePercentage,
      uptimeDuration,
      batteryVoltage,
      pingLatency,
    });
  }
  return sites;
};

export const generateDummyLogs = (sites: DummySite[]): DummyPullingLog[] => {
  const logs: DummyPullingLog[] = [];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const site = sites[Math.floor(Math.random() * sites.length)];
    const isSuccess = Math.random() > 0.2;
    
    const logDate = new Date(now.getTime() - i * 60000); // 1 minute intervals backwards

    logs.push({
      id: `log-${i}`,
      timestamp: logDate.toISOString(),
      siteName: site.name,
      batteryType: site.batteryType,
      result: isSuccess ? 'success' : 'failed',
      errorMessage: isSuccess ? undefined : 'Connection timeout to VSAT terminal or Redis stream empty.',
    });
  }
  return logs;
};

export const dummySites = generateDummySites();
export const dummyLogs = generateDummyLogs(dummySites);
