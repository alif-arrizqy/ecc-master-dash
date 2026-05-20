import { useState } from "react";
import { Search } from "lucide-react";
import { dummyLogs, DummyPullingLog } from "../utils/uptimeDummyData";
import { format } from "date-fns";
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

export const PullingLogsTab = () => {
  const [search, setSearch] = useState("");
  const [batteryType, setBatteryType] = useState<string>("all");
  const [result, setResult] = useState<string>("all");

  const filteredLogs = dummyLogs.filter((log) => {
    const matchesSearch =
      log.siteName.toLowerCase().includes(search.toLowerCase());
    const matchesBattery =
      batteryType === "all" || log.batteryType === batteryType;
    const matchesResult = result === "all" || log.result === result;
    return matchesSearch && matchesBattery && matchesResult;
  });

  const totalLogs = dummyLogs.length;
  const successCount = dummyLogs.filter(log => log.result === "success").length;
  const failedCount = dummyLogs.filter(log => log.result === "failed").length;
  const successRate = totalLogs > 0 ? (successCount / totalLogs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Total Pulling Logs</span>
          <span className="text-2xl font-bold">{totalLogs} <span className="text-sm font-normal text-muted-foreground">Logs</span></span>
        </div>
        
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Average Pulling Success</span>
          <span className="text-2xl font-bold text-primary">{successRate.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">%</span></span>
        </div>
        
        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Pulling Success</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-500">{successCount}</span>
            <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full font-medium">Success</span>
          </div>
        </div>

        <div className="bg-card rounded-lg card-shadow p-4 flex flex-col gap-1">
          <span className="text-sm font-medium text-muted-foreground">Pulling Failed</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-red-500">{failedCount}</span>
            <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full font-medium">Failed</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-4 rounded-lg card-shadow">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari Site Name / Site ID..."
            className="pl-9 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select value={batteryType} onValueChange={setBatteryType}>
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
          <Select value={result} onValueChange={setResult}>
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

      {/* Table View */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>Battery Type</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Error Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss")}
                  </TableCell>
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
                    {log.errorMessage || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Tidak ada log yang ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
