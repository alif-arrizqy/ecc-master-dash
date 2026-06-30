import { useMemo, useState } from "react";
import { Search, Clock, Activity, Loader2 } from "lucide-react";
import { format, isToday } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SiteItem } from "../services/uptime-loggers.api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  useUptimeSummary,
  useUptimeSites,
  useSiteCoordinates,
} from "../hooks/useUptimeLoggersQueries";
import { SiteUptimeMap, type MapSite } from "./SiteUptimeMap";

function formatSiteLabel(siteId: string, siteName: string): string {
  const cleanName = siteName.replace(/[_-]/g, " ").trim().toUpperCase();
  const id = siteId.toUpperCase();
  if (!cleanName || cleanName === id) return id;
  return `${id} - ${cleanName}`;
}

type StatusListDialog = "online" | "offline" | null;

export const SiteUptimeTab = () => {
  const [search, setSearch] = useState("");
  const [batteryType, setBatteryType] = useState<string>("all");
  const [uptimeHealth, setUptimeHealth] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [statusDialog, setStatusDialog] = useState<StatusListDialog>(null);

  const dateStr = date ? format(date, "yyyy-MM-dd") : undefined;
  const batteryFilter = batteryType !== "all" ? batteryType : undefined;
  const isRealtime = !date || isToday(date);

  const { data: summary, isLoading: summaryLoading } = useUptimeSummary(dateStr);
  const { data: sites, isLoading: sitesLoading, isError } = useUptimeSites({
    date: dateStr,
    batteryType: batteryFilter,
    search: search || undefined,
    uptimeHealth: uptimeHealth !== "all" ? uptimeHealth : undefined,
  });
  const { data: coords } = useSiteCoordinates();

  const { data: allSites, isLoading: allSitesLoading } = useUptimeSites(
    { date: dateStr, batteryType: batteryFilter },
    { enabled: Boolean(dateStr) },
  );

  // Merge uptime sites (after filters) with coordinates from sites-service.
  const mapSites = useMemo<MapSite[]>(() => {
    if (!sites || !coords) return [];
    return sites.flatMap((site) => {
      const c = coords.get(site.siteId.toUpperCase());
      return c ? [{ ...site, lat: c.lat, lng: c.lng }] : [];
    });
  }, [sites, coords]);

  const statusListSites = useMemo(() => {
    if (!statusDialog || !allSites) return [];
    return allSites
      .filter((s) => s.connectivityStatus === statusDialog)
      .sort((a, b) => a.siteName.localeCompare(b.siteName));
  }, [allSites, statusDialog]);

  const isFiltered = Boolean(search) || Boolean(batteryFilter) || uptimeHealth !== "all";

  // Counts from the currently filtered site list, for the "X dari Y" badges.
  const filtered = useMemo(() => {
    if (!sites) return null;
    const online = sites.filter((s) => s.connectivityStatus === "online").length;
    const avg = sites.length
      ? sites.reduce((acc, s) => acc + s.uptimePercentage, 0) / sites.length
      : 0;
    return { total: sites.length, online, offline: sites.length - online, avg };
  }, [sites]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-lg card-shadow">
        <div className="w-full md:w-auto">
          <DatePicker date={date} setDate={setDate} disabled={(d) => d > new Date()} />
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

      {/* Loading State */}
      {sitesLoading && (
        <div className="py-24 flex flex-col items-center justify-center bg-card/40 backdrop-blur-sm rounded-2xl border border-border/50">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Memuat data site...</p>
        </div>
      )}

      {/* Error State */}
      {isError && !sitesLoading && (
        <div className="py-24 flex flex-col items-center justify-center bg-card/40 backdrop-blur-sm rounded-2xl border border-red-500/20">
          <Activity className="w-12 h-12 text-red-500/50 mb-4" />
          <p className="text-red-500 font-medium">Gagal memuat data. Pastikan backend berjalan di port 8882.</p>
        </div>
      )}

      {/* Map View */}
      {!sitesLoading && !isError && <SiteUptimeMap sites={mapSites} />}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Total Site</span>
          <span className="text-2xl font-bold">
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : summary?.totalSites ?? 0}
            <span className="text-sm font-normal text-muted-foreground"> Site</span>
          </span>
          {isFiltered && filtered && (
            <span className="text-[10px] text-muted-foreground bg-muted/60 w-fit px-2 py-0.5 rounded-full">
              menampilkan {filtered.total} dari {summary?.totalSites ?? 0}
            </span>
          )}
        </div>

        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Rata-rata Uptime</span>
          <span className="text-2xl font-bold">
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${summary?.avgUptime?.toFixed(1) ?? 0}`}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </span>
          {isFiltered && filtered ? (
            <span className="text-[10px] text-muted-foreground bg-muted/60 w-fit px-2 py-0.5 rounded-full">
              filter: {filtered.avg.toFixed(1)}% ({filtered.total} site)
            </span>
          ) : (
            isRealtime && (
              <span className="text-[10px] text-muted-foreground">sejak 00:00 s/d sekarang</span>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => setStatusDialog("online")}
          className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1 text-left cursor-pointer transition-colors hover:border-green-500/40 hover:bg-green-500/5 border border-transparent"
          title="Klik untuk lihat daftar site online"
        >
          <span className="text-sm font-medium text-muted-foreground">Site Online</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-green-500">
              {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : summary?.onlineCount ?? 0}
              <span className="text-sm font-normal text-muted-foreground"> Site</span>
            </span>
            {isRealtime && (
              <span className="text-xs text-green-700 dark:text-green-400 bg-green-500/25 border border-green-500/40 px-2 py-0.5 rounded-full font-medium">
                Update &lt; 2 Jam
              </span>
            )}
          </div>
          {isFiltered && filtered && (
            <span className="text-[10px] text-muted-foreground bg-muted/60 w-fit px-2 py-0.5 rounded-full">
              menampilkan {filtered.online} dari {summary?.onlineCount ?? 0}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusDialog("offline")}
          className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1 text-left cursor-pointer transition-colors hover:border-red-500/40 hover:bg-red-500/5 border border-transparent"
          title="Klik untuk lihat daftar site offline"
        >
          <span className="text-sm font-medium text-muted-foreground">Site Offline</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-bold text-red-500">
              {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : summary?.offlineCount ?? 0}
              <span className="text-sm font-normal text-muted-foreground"> Site</span>
            </span>
            {isRealtime && (
              <span className="text-xs text-red-700 dark:text-red-400 bg-red-500/25 border border-red-500/40 px-2 py-0.5 rounded-full font-medium">
                Update &gt; 2 Jam
              </span>
            )}
          </div>
          {isFiltered && filtered && (
            <span className="text-[10px] text-muted-foreground bg-muted/60 w-fit px-2 py-0.5 rounded-full">
              menampilkan {filtered.offline} dari {summary?.offlineCount ?? 0}
            </span>
          )}
        </button>
      </div>

      <Dialog open={statusDialog !== null} onOpenChange={(open) => !open && setStatusDialog(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{statusDialog === "online" ? "Site Online" : "Site Offline"}</DialogTitle>
            {isRealtime && (
              <DialogDescription>
                {statusDialog === "online"
                  ? "Site dengan pembaruan data dalam 2 jam terakhir."
                  : "Site tanpa pembaruan data lebih dari 2 jam."}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
            {allSitesLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : statusListSites.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada site dalam kategori ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {statusListSites.map((site) => (
                  <StatusListRow
                    key={site.siteId}
                    site={site}
                    variant={statusDialog === "online" ? "online" : "offline"}
                    onOpenGrafana={(url) => url && window.open(url, "_blank")}
                  />
                ))}
              </ul>
            )}
          </div>

          {!allSitesLoading && statusListSites.length > 0 && (
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              {statusListSites.length} site
              {batteryFilter ? ` · filter battery: ${batteryFilter}` : ""}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function StatusListRow({
  site,
  variant,
  onOpenGrafana,
}: {
  site: SiteItem;
  variant: "online" | "offline";
  onOpenGrafana: (url: string | null) => void;
}) {
  const dotClass = variant === "online" ? "bg-green-500" : "bg-red-500";

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpenGrafana(site.grafanaUrl)}
        disabled={!site.grafanaUrl}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/50 px-3 py-2.5 text-left transition-colors hover:bg-accent/50 disabled:cursor-default disabled:opacity-100"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`w-2 h-2 shrink-0 rounded-full ${dotClass}`} />
          <span className="font-medium text-sm truncate">
            {formatSiteLabel(site.siteId, site.siteName)}
          </span>
        </div>
        <div className="flex flex-col items-end shrink-0 text-xs text-muted-foreground">
          <span>{site.uptimePercentage}%</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {site.lastUpdate ? format(new Date(site.lastUpdate), "dd MMM HH:mm") : "N/A"}
          </span>
        </div>
      </button>
    </li>
  );
}
