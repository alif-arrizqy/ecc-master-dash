import { useState, useMemo } from "react";
import { Search, Clock, Zap, Activity, Wifi } from "lucide-react";
import { dummySites } from "../utils/uptimeDummyData";
import { format, isToday, differenceInHours } from "date-fns";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

// Circular Progress Component for Uptime
const CircularProgress = ({ value, colorClass }: { value: number; colorClass: string }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-[52px] h-[52px] transform -rotate-90">
        <circle
          className="text-muted/20"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="26"
          cy="26"
        />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-in-out`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="26"
          cy="26"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold">{value}%</span>
      </div>
    </div>
  );
};

export const SiteUptimeTab = () => {
  const [search, setSearch] = useState("");
  const [batteryType, setBatteryType] = useState<string>("all");
  const [uptimeHealth, setUptimeHealth] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date()); // Default to Today

  // Generate deterministic random data for past dates to simulate historical data
  const currentData = useMemo(() => {
    if (!date || isToday(date)) return dummySites;
    
    return dummySites.map(site => {
      // Use date's timestamp to create a deterministic pseudo-random variation
      const seed = date.getDate() + date.getMonth(); 
      
      // Randomize uptime
      const variation = (seed % 30) - 15; // -15 to +15
      let pct = site.uptimePercentage + variation;
      if (pct > 100) pct = 100;
      if (pct < 30) pct = 30 + (seed % 20); // Keep it realistic
      
      // Randomize voltage slightly
      const vVar = (seed % 4) - 2;
      const v = +(site.batteryVoltage + (vVar * 0.1)).toFixed(1);

      return {
        ...site,
        uptimePercentage: pct,
        batteryVoltage: v,
        pingLatency: site.pingLatency + (seed * 5),
        // Scramble the duration text to match the new percentage
        uptimeDuration: pct === 100 ? "24h 00m" : `${Math.floor((pct/100)*24)}h ${seed % 60}m`
      };
    });
  }, [date]);

  const filteredSites = currentData.filter((site) => {
    const matchesSearch = site.name.toLowerCase().includes(search.toLowerCase());
    const matchesBattery = batteryType === "all" || site.batteryType === batteryType;
    
    let matchesUptime = true;
    if (uptimeHealth === "100") {
      matchesUptime = site.uptimePercentage === 100;
    } else if (uptimeHealth === "95") {
      matchesUptime = site.uptimePercentage <= 95 && site.uptimePercentage > 70;
    } else if (uptimeHealth === "70") {
      matchesUptime = site.uptimePercentage <= 70;
    }

    return matchesSearch && matchesBattery && matchesUptime;
  });

  // Dynamic Logic: 
  // If Today -> use Online/Offline (last update < 2 hours)
  // If Past Date -> use Uptime Percentage
  const getSiteStatus = (site: typeof dummySites[0]) => {
    const isRealtime = !date || isToday(date);
    
    if (isRealtime) {
      const hoursSinceUpdate = differenceInHours(new Date(), new Date(site.lastUpdatedAt));
      const isOnline = hoursSinceUpdate < 2;
      return {
        isOnline,
        statusText: isOnline ? 'Online' : 'Offline',
        colorClass: isOnline ? 'text-green-500' : 'text-red-500',
        bgClass: isOnline ? 'bg-green-500' : 'bg-red-500',
        glowClass: isOnline ? 'shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse',
      };
    } else {
      // Historical mode (based on uptime)
      const pct = site.uptimePercentage;
      const isHealthy = pct === 100;
      const isWarning = pct > 70 && pct < 100;
      return {
        isOnline: null,
        statusText: isHealthy ? 'Healthy' : isWarning ? 'Warning' : 'Critical',
        colorClass: isHealthy ? 'text-green-500' : isWarning ? 'text-yellow-500' : 'text-red-500',
        bgClass: isHealthy ? 'bg-green-500' : isWarning ? 'bg-yellow-500' : 'bg-red-500',
        glowClass: isHealthy ? 'shadow-[0_0_8px_rgba(34,197,94,0.6)]' : isWarning ? 'shadow-[0_0_8px_rgba(234,179,8,0.6)]' : 'shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse',
      };
    }
  };

  const handleCardClick = (siteName: string) => {
    toast.success(`Membuka Grafana untuk ${siteName}`, {
      description: "Anda akan diarahkan ke dashboard analitik historis untuk site ini.",
    });
  };

  // Summary Calculations (Global, unaffected by filters)
  const isRealtime = !date || isToday(date);
  const totalSites = currentData.length;
  const avgUptime = currentData.reduce((acc, curr) => acc + curr.uptimePercentage, 0) / (totalSites || 1);
  
  let onlineCount = 0;
  let offlineCount = 0;
  let healthyCount = 0;
  let warningCount = 0;
  let criticalCount = 0;
  
  currentData.forEach(site => {
    if (isRealtime) {
      const hoursSinceUpdate = differenceInHours(new Date(), new Date(site.lastUpdatedAt));
      if (hoursSinceUpdate < 2) onlineCount++;
      else offlineCount++;
    } else {
      if (site.uptimePercentage === 100) healthyCount++;
      else if (site.uptimePercentage > 70) warningCount++;
      else criticalCount++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Total Site</span>
          <span className="text-2xl font-bold">{totalSites} <span className="text-sm font-normal text-muted-foreground">Site</span></span>
        </div>
        
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Rata-rata Uptime</span>
          <span className="text-2xl font-bold">{avgUptime.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">%</span></span>
        </div>
        
        {isRealtime ? (
          <>
            <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1" title="Site yang mengirim data dalam 2 jam terakhir">
              <span className="text-sm font-medium text-muted-foreground">Site Online</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-green-500">{onlineCount}</span>
                <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">Update &lt; 2 Jam</span>
              </div>
            </div>
            <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1" title="Site yang terputus atau belum mengirim data lebih dari 2 jam">
              <span className="text-sm font-medium text-muted-foreground">Site Offline</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-red-500">{offlineCount}</span>
                <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-medium">Update &gt; 2 Jam</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Site Sehat</span>
              <span className="text-2xl font-bold text-green-500">{healthyCount} <span className="text-sm font-medium text-muted-foreground">Site</span></span>
            </div>
            <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">Waspada & Kritis</span>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold text-yellow-500">{warningCount} <span className="text-xs font-normal text-muted-foreground uppercase">Waspada</span></span>
                <span className="text-2xl font-bold text-red-500">{criticalCount} <span className="text-xs font-normal text-muted-foreground uppercase">Kritis</span></span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg card-shadow">
        <div className="w-full md:w-auto">
          <DatePicker 
            date={date} 
            setDate={setDate} 
            disabled={(d) => d > new Date()} 
          />
        </div>
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari Site Name / Site ID..."
            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="w-full sm:w-48">
          <Select value={batteryType} onValueChange={setBatteryType}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Battery Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Battery</SelectItem>
              <SelectItem value="jspro">JSPro</SelectItem>
              <SelectItem value="talis5">Talis 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-48">
          <Select value={uptimeHealth} onValueChange={setUptimeHealth}>
            <SelectTrigger className="bg-background/50 border-border/50">
              <SelectValue placeholder="Uptime Health" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Uptime</SelectItem>
              <SelectItem value="100">100% (Healthy)</SelectItem>
              <SelectItem value="95">&lt;= 95% (Warning)</SelectItem>
              <SelectItem value="70">&lt; 70% (Critical)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredSites.map((site) => {
          const status = getSiteStatus(site);
          
          return (
          <div 
            key={site.id}
            onClick={() => handleCardClick(site.name)}
            className="group relative flex flex-col bg-card/40 backdrop-blur-md rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-primary/40"
          >
            {/* Subtle glow effect behind card on hover */}
            <div 
              className={`absolute -inset-2 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl -z-10 rounded-3xl ${status.bgClass}`} 
            />

            <div className="p-5 flex flex-col gap-4">
              {/* Header Section */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Status Dot */}
                    <div className={`w-2 h-2 shrink-0 rounded-full ${status.bgClass} ${status.glowClass}`} title={status.statusText} />
                    <h3 className="font-bold text-foreground truncate text-base tracking-tight" title={site.name}>
                      {site.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="uppercase text-[9px] font-bold tracking-wider bg-secondary/80 text-secondary-foreground px-2 py-0.5 rounded-full">
                      {site.batteryType}
                    </span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(site.lastUpdatedAt), "dd MMM HH:mm")}
                    </span>
                  </div>
                </div>

                {/* Circular Uptime */}
                <div className="shrink-0" title={`Uptime (Color based on Uptime %, not realtime status)`}>
                  <CircularProgress 
                    value={site.uptimePercentage} 
                    colorClass={
                      site.uptimePercentage === 100 ? "text-green-500" 
                      : site.uptimePercentage > 70 ? "text-yellow-500" 
                      : "text-red-500"
                    } 
                  />
                </div>
              </div>

              {/* Uptime Text Banner */}
              <div className="bg-background/40 rounded-xl p-3 flex items-center justify-between border border-border/40 mt-1">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Uptime Duration</span>
                </div>
                <span className="text-sm font-bold text-foreground bg-secondary/50 px-2.5 py-1 rounded-md">
                  {site.uptimeDuration}
                </span>
              </div>

              {/* Bottom Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="flex items-center gap-3 bg-card/30 p-2.5 rounded-xl border border-border/30 group-hover:bg-card/50 transition-colors">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">Voltage</span>
                    <span className="font-bold text-sm truncate">{site.batteryVoltage} V</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-card/30 p-2.5 rounded-xl border border-border/30 group-hover:bg-card/50 transition-colors">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold truncate">Latency</span>
                    <span className="font-bold text-sm truncate">{site.pingLatency} ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )})}
      </div>

      {filteredSites.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50">
          <Activity className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Tidak ada site yang cocok dengan filter.</p>
        </div>
      )}
    </div>
  );
};
