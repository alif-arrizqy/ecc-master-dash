import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Maximize, Minimize, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";
import type { SiteItem } from "../services/uptime-loggers.api";
import type { SiteCoord } from "../hooks/useUptimeLoggersQueries";

export type MapSite = SiteItem & SiteCoord;

function statusColor(status: string): string {
  switch (status) {
    case "online":
    case "healthy":
      return "#22c55e";
    case "warning":
      return "#eab308";
    case "offline":
    case "critical":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

// Teardrop pin icon colored by status, cached per color.
const iconCache = new Map<string, L.DivIcon>();
function pinIcon(color: string): L.DivIcon {
  let icon = iconCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: "",
      html: `<svg width="28" height="38" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
      </svg>`,
      iconSize: [28, 38],
      iconAnchor: [14, 38],
      popupAnchor: [0, -34],
    });
    iconCache.set(color, icon);
  }
  return icon;
}

function siteLabel(siteId: string, siteName: string): string {
  const name = siteName.replace(/[_-]/g, " ").trim().toUpperCase();
  const id = siteId.toUpperCase();
  return !name || name === id ? id : `${id} - ${name}`;
}

// Fit map bounds to all markers whenever the set of sites changes.
function FitBounds({ sites }: { sites: MapSite[] }) {
  const map = useMap();
  useEffect(() => {
    if (sites.length === 0) return;
    const bounds = L.latLngBounds(sites.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, sites]);
  return null;
}

// Keep tiles correct after fullscreen toggles.
function ResizeOnFullscreen() {
  const map = useMap();
  useEffect(() => {
    const handler = () => setTimeout(() => map.invalidateSize(), 150);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [map]);
  return null;
}

const LEGEND = [
  { color: "#22c55e", label: "Online / Healthy" },
  { color: "#eab308", label: "Warning" },
  { color: "#ef4444", label: "Offline / Critical" },
  { color: "#94a3b8", label: "Unknown" },
];

export const SiteUptimeMap = ({ sites }: { sites: MapSite[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // When a filter narrows results to a single site, open its popup automatically.
  useEffect(() => {
    if (sites.length !== 1) return;
    const t = setTimeout(() => markerRefs.current.get(sites[0].siteId)?.openPopup(), 300);
    return () => clearTimeout(t);
  }, [sites]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card ${
        isFullscreen ? "h-screen rounded-none" : "h-[520px]"
      }`}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="absolute right-3 top-3 z-[1000] flex items-center gap-1.5 rounded-lg bg-card/90 px-3 py-2 text-sm font-medium shadow-md backdrop-blur transition-colors hover:bg-card border border-border/60"
        title={isFullscreen ? "Keluar fullscreen" : "Fullscreen peta"}
      >
        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        {isFullscreen ? "Keluar" : "Fullscreen"}
      </button>

      <div className="absolute left-3 bottom-8 z-[1000] rounded-lg bg-card/90 px-3 py-2 shadow-md backdrop-blur border border-border/60">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status Site
        </p>
        <ul className="space-y-1">
          {LEGEND.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <MapContainer
        center={[-3, 134]}
        zoom={6}
        scrollWheelZoom
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={120}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds sites={sites} />
        <ResizeOnFullscreen />

        {sites.map((site) => {
          const color = statusColor(site.status);
          return (
            <Marker
              key={site.siteId}
              position={[site.lat, site.lng]}
              icon={pinIcon(color)}
              ref={(layer) => {
                if (layer) markerRefs.current.set(site.siteId, layer);
                else markerRefs.current.delete(site.siteId);
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="font-bold text-sm">{siteLabel(site.siteId, site.siteName)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-semibold text-right">{site.uptimePercentage}%</span>
                    <span className="text-muted-foreground">Durasi</span>
                    <span className="font-semibold text-right">{site.uptimeDuration ?? "—"}</span>
                    <span className="text-muted-foreground">Voltage</span>
                    <span className="font-semibold text-right">
                      {site.batteryVoltageV != null ? `${site.batteryVoltageV.toFixed(2)} V` : "—"}
                    </span>
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-semibold text-right">
                      {site.pingLatencyMs != null ? `${site.pingLatencyMs} ms` : "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {site.lastUpdate ? format(new Date(site.lastUpdate), "dd MMM yyyy HH:mm") : "N/A"}
                  </div>

                  {site.grafanaUrl && (
                    <a
                      href={site.grafanaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Buka Grafana
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
