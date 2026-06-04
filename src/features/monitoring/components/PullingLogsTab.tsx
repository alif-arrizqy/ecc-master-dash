import { useState } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday } from "date-fns";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { usePullingLogsSummary, usePullingLogs } from "../hooks/useUptimeLoggersQueries";

export const PullingLogsTab = () => {
  const [search, setSearch] = useState("");
  const [batteryType, setBatteryType] = useState<string>("all");
  const [result, setResult] = useState<string>("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [page, setPage] = useState(1);
  const limit = 50;

  const dateStr = date ? format(date, "yyyy-MM-dd") : undefined;

  const { data: summary, isLoading: summaryLoading } = usePullingLogsSummary(dateStr);
  const { data: logsData, isLoading: logsLoading, isError } = usePullingLogs({
    date: dateStr,
    batteryType: batteryType !== "all" ? batteryType : undefined,
    result: result !== "all" ? result : undefined,
    search: search || undefined,
    page,
    limit,
  });

  const logs = logsData?.items ?? [];
  const pagination = logsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Total Pulling Logs</span>
          <span className="text-2xl font-bold">
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : summary?.totalLogs ?? 0}
            <span className="text-sm font-normal text-muted-foreground"> Logs</span>
          </span>
        </div>
        
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Average Pulling Success</span>
          <span className="text-2xl font-bold text-primary">
            {summaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : `${summary?.successRate?.toFixed(1) ?? 0}`}
            <span className="text-sm font-normal text-muted-foreground">%</span>
          </span>
        </div>
        
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Pulling Success</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-500">{summary?.successCount ?? 0}</span>
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">Success</span>
          </div>
        </div>

        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Pulling Failed</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-500">{summary?.failedCount ?? 0}</span>
            <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-medium">Failed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg card-shadow">
        <div className="w-full md:w-auto">
          <DatePicker
            date={date}
            setDate={(d) => { setDate(d); setPage(1); }}
            disabled={(d) => d > new Date()}
          />
        </div>

        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari Site Name / Site ID..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select value={batteryType} onValueChange={(v) => { setBatteryType(v); setPage(1); }}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Battery Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Battery</SelectItem>
              <SelectItem value="jspro">JSPro</SelectItem>
              <SelectItem value="talis5">Talis 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-48">
          <Select value={result} onValueChange={(v) => { setResult(v); setPage(1); }}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Result</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading */}
      {logsLoading && (
        <div className="py-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Memuat pulling logs...</p>
        </div>
      )}

      {/* Error */}
      {isError && !logsLoading && (
        <div className="py-16 flex flex-col items-center justify-center bg-card/40 rounded-xl border border-red-500/20">
          <p className="text-red-500 font-medium">Gagal memuat data. Pastikan backend berjalan di port 8882.</p>
        </div>
      )}

      {/* Table View */}
      {!logsLoading && !isError && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead>Site Name</TableHead>
                <TableHead>Battery Type</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Error Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {log.timestamp ? format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss") : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.siteId}</TableCell>
                    <TableCell>{log.siteName}</TableCell>
                    <TableCell>
                      <span className="uppercase text-xs font-semibold bg-secondary px-2 py-1 rounded-md">
                        {log.batteryType}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.result === "success" ? (
                        <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                      {log.errorMessage || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Tidak ada log yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
