import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateTimePickerField, combineDateTime, type DateTimeParts } from '../components/DateTimePickerField';
import { SiteMultiSelect } from '../components/SiteMultiSelect';
import type { SlaInternalBattery, ResolvedLoggerSite } from '../lib/resolve-logger-sites';
import { resolveLoggerSites } from '../lib/resolve-logger-sites';
import { toSlaInternalQueryTimestamp } from '../lib/to-sla-query-timestamp';
import { fetchSla2ForLogger, type Sla2DailyRow } from '../services/sla-internal.api';
import { downloadAoAsExcel } from '../lib/excel-utils';

const COLS: { key: keyof Sla2DailyRow | string; label: string }[] = [
  { key: 'nojs', label: 'NOJS' },
  { key: 'site', label: 'SITE' },
  { key: 'date', label: 'DATE' },
  { key: 'up_time', label: 'UP TIME' },
  { key: 'batt_volt', label: 'BATT VOLT' },
  { key: 'vsat_curr', label: 'VSAT CURR' },
  { key: 'bts_curr', label: 'BTS CURR' },
  { key: 'eh1', label: 'EH1' },
  { key: 'eh2', label: 'EH2' },
  { key: 'eh3', label: 'EH3' },
  { key: 'edl1', label: 'EDL1' },
  { key: 'edl2', label: 'EDL2' },
  { key: 'lvd1', label: 'LVD1' },
  { key: 'lvd2', label: 'LVD2' },
];

function startPartsDefault(): DateTimeParts {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return { date: d, time: '00:00' };
}

function endPartsDefault(): DateTimeParts {
  const d = new Date();
  d.setHours(23, 59, 0, 0);
  return { date: d, time: '23:59' };
}

const SlaInternal2Page = () => {
  const [battery, setBattery] = useState<SlaInternalBattery>('JSPRO');
  const [startParts, setStartParts] = useState<DateTimeParts>(startPartsDefault);
  const [endParts, setEndParts] = useState<DateTimeParts>(endPartsDefault);
  const [siteOptions, setSiteOptions] = useState<ResolvedLoggerSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedLoggerIds, setSelectedLoggerIds] = useState<number[]>([]);
  const [rows, setRows] = useState<Sla2DailyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setSitesLoading(true);
      try {
        const r = await resolveLoggerSites(battery);
        if (!cancel) {
          setSiteOptions(r);
          setSelectedLoggerIds([]);
        }
      } catch (e) {
        if (!cancel) {
          toast.error(e instanceof Error ? e.message : 'Gagal memuat daftar site');
          setSiteOptions([]);
        }
      } finally {
        if (!cancel) setSitesLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [battery]);

  const start = combineDateTime(startParts);
  const end = combineDateTime(endParts);

  const selectedSites = useMemo(
    () => siteOptions.filter((s) => selectedLoggerIds.includes(s.loggerId)),
    [siteOptions, selectedLoggerIds]
  );

  const runQuery = async () => {
    if (!start || !end) {
      toast.error('Lengkapi tanggal dan jam mulai / selesai');
      return;
    }
    if (selectedSites.length === 0) {
      toast.error('Pilih minimal satu site');
      return;
    }
    if (start >= end) {
      toast.error('Start harus lebih awal dari end');
      return;
    }

    const qs = toSlaInternalQueryTimestamp(start);
    const qe = toSlaInternalQueryTimestamp(end);

    setLoading(true);
    setPage(1);
    try {
      const chunks = await Promise.all(
        selectedSites.map((s) =>
          fetchSla2ForLogger({ loggerId: s.loggerId, start: qs, end: qe }).catch((err) => {
            throw new Error(`${s.label}: ${err instanceof Error ? err.message : 'error'}`);
          })
        )
      );
      const merged = chunks.flat();
      merged.sort((a, b) => {
        const da = String(a.date).localeCompare(String(b.date));
        if (da !== 0) return da;
        return String(a.site).localeCompare(String(b.site));
      });
      setRows(merged);
      toast.success(`SLA 2 dimuat: ${merged.length} baris`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat SLA 2');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = rows.slice((pageSafe - 1) * pageSize, pageSafe * pageSize);

  const exportExcel = () => {
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diunduh');
      return;
    }
    const plain = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const c of COLS) {
        o[c.key] = r[c.key as keyof Sla2DailyRow];
      }
      return o;
    });
    downloadAoAsExcel(
      plain,
      COLS.map((c) => ({ key: c.key, label: c.label })),
      'SLA2',
      `sla-internal-2-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success('File Excel diunduh');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SLA 2 Internal
            </h1>
          </div>
        </div>
      </div>

      <Card className="card-shadow animate-slide-up mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <DateTimePickerField label="Start timestamp" value={startParts} onChange={setStartParts} />
            <DateTimePickerField label="End timestamp" value={endParts} onChange={setEndParts} />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">Tipe baterai</Label>
              <Select value={battery} onValueChange={(v) => setBattery(v as SlaInternalBattery)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSPRO">JSPRO</SelectItem>
                  <SelectItem value="TALIS5">TALIS5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SiteMultiSelect
            options={siteOptions}
            selectedIds={selectedLoggerIds}
            onChange={setSelectedLoggerIds}
            disabled={sitesLoading}
          />
          {sitesLoading && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar site…
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button onClick={runQuery} disabled={loading || sitesLoading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Terapkan
            </Button>
            <Button variant="outline" onClick={exportExcel} disabled={rows.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Unduh Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {rows.length > 0
                ? `Menampilkan ${(pageSafe - 1) * pageSize + 1}–${Math.min(pageSafe * pageSize, rows.length)} dari ${rows.length}`
                : 'Belum ada data'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {COLS.map((c) => (
                    <TableHead key={c.key} className="whitespace-nowrap text-xs font-medium">
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={COLS.length} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : slice.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLS.length} className="text-center py-12 text-muted-foreground">
                      Jalankan pencarian untuk menampilkan tabel
                    </TableCell>
                  </TableRow>
                ) : (
                  slice.map((row, i) => (
                    <TableRow key={`${row.nojs}-${row.date}-${i}`} className="hover:bg-muted/30">
                      {COLS.map((c) => (
                        <TableCell key={c.key} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                          {String(row[c.key as keyof Sla2DailyRow] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {rows.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Halaman {pageSafe} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SlaInternal2Page;
