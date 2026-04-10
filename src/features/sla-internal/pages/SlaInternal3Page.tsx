import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { fetchSla3ExportBlob } from '../services/sla-internal.api';
import { parseSla3XlsxBlob, triggerBlobDownload } from '../lib/excel-utils';

const PREVIEW_LIMIT = 10;

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

/** Urutan kolom tampilan (kunci dari sheet Excel backend + meta) */
const SLA3_DISPLAY: { key: string; label: string }[] = [
  { key: '_nojs', label: 'NOJS' },
  { key: '_site', label: 'SITE' },
  { key: 'Date Time', label: 'DATE TIME' },
  { key: 'Batt Volt', label: 'BATT VOLT' },
  { key: 'Vsat Curr', label: 'VSAT CURR' },
  { key: 'Bts Curr', label: 'BTS CURR' },
  { key: 'Obl Curr', label: 'OBL CURR' },
  { key: 'Pv1Curr', label: 'PV1 CURR' },
  { key: 'Pv2Curr', label: 'PV2 CURR' },
  { key: 'pv1Volt', label: 'PV1 VOLT' },
  { key: 'pv2Volt', label: 'PV2 VOLT' },
  { key: 'Eh1', label: 'EH1' },
  { key: 'Eh2', label: 'EH2' },
  { key: 'Eh3', label: 'EH3' },
  { key: 'Edl1', label: 'EDL1' },
  { key: 'Edl2', label: 'EDL2' },
  { key: 'Lvd1', label: 'LVD1' },
  { key: 'Lvd2', label: 'LVD2' },
  { key: 'Duration', label: 'DURATION' },
  { key: 'Real', label: 'REAL' },
  { key: 'Flag Status', label: 'FLAG STATUS' },
];

const SlaInternal3Page = () => {
  const [battery, setBattery] = useState<SlaInternalBattery>('JSPRO');
  const [startParts, setStartParts] = useState<DateTimeParts>(startPartsDefault);
  const [endParts, setEndParts] = useState<DateTimeParts>(endPartsDefault);
  const [siteOptions, setSiteOptions] = useState<ResolvedLoggerSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedLoggerIds, setSelectedLoggerIds] = useState<number[]>([]);
  const [apt2, setApt2] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [previewMeta, setPreviewMeta] = useState<{ nojs: string; site: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setSitesLoading(true);
      try {
        const r = await resolveLoggerSites(battery);
        if (!cancel) {
          setSiteOptions(r);
          setSelectedLoggerIds([]);
          setPreviewRows([]);
          setPreviewMeta(null);
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

  const validateRange = (): boolean => {
    if (!start || !end) {
      toast.error('Lengkapi tanggal dan jam mulai / selesai');
      return false;
    }
    if (selectedSites.length === 0) {
      toast.error('Pilih satu site');
      return false;
    }
    if (start >= end) {
      toast.error('Start harus lebih awal dari end');
      return false;
    }
    return true;
  };

  const loadPreview = async () => {
    if (!validateRange()) return;
    const first = selectedSites[0];
    const qs = toSlaInternalQueryTimestamp(start!);
    const qe = toSlaInternalQueryTimestamp(end!);

    setLoadingPreview(true);
    setPreviewRows([]);
    setPreviewMeta(null);
    try {
      const blob = await fetchSla3ExportBlob({
        loggerId: first.loggerId,
        nojsCode: first.nojsCode,
        start: qs,
        end: qe,
        apt2,
      });
      const parsed = await parseSla3XlsxBlob(blob);
      const trimmed = parsed.slice(0, PREVIEW_LIMIT).map((row) => ({
        ...row,
        _nojs: first.nojsCode,
        _site: first.siteName,
      }));
      setPreviewRows(trimmed);
      setPreviewMeta({ nojs: first.nojsCode, site: first.siteName });
      toast.success(`Preview: ${trimmed.length} baris (maks ${PREVIEW_LIMIT})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal memuat preview SLA 3');
    } finally {
      setLoadingPreview(false);
    }
  };

  const downloadAll = async () => {
    if (!validateRange()) return;
    const qs = toSlaInternalQueryTimestamp(start!);
    const qe = toSlaInternalQueryTimestamp(end!);

    setDownloading(true);
    try {
      const s = selectedSites[0];
      const blob = await fetchSla3ExportBlob({
        loggerId: s.loggerId,
        nojsCode: s.nojsCode,
        start: qs,
        end: qe,
        apt2,
      });
      const head = new Uint8Array((await blob.slice(0, 1).arrayBuffer()))[0];
      if (head === 0x7b) {
        const text = await blob.text();
        const j = JSON.parse(text) as { message?: string };
        throw new Error(`${s.label}: ${j.message || 'gagal export'}`);
      }
      const safeName = s.siteName.replace(/[\\/:*?"<>|]/g, '_');
      triggerBlobDownload(blob, `${safeName}-sla3.xlsx`);
      toast.success('File Excel diunduh');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal unduh SLA 3');
    } finally {
      setDownloading(false);
    }
  };

  const activeCols = useMemo(() => {
    if (previewRows.length === 0) return SLA3_DISPLAY;
    const keys = new Set<string>();
    previewRows.forEach((r) => Object.keys(r).forEach((k) => keys.add(k)));
    const ordered = SLA3_DISPLAY.filter((c) => keys.has(c.key));
    const extras = Array.from(keys)
      .filter((k) => !SLA3_DISPLAY.some((c) => c.key === k) && !k.startsWith('_'))
      .sort()
      .map((k) => ({ key: k, label: k.toUpperCase() }));
    return [...ordered, ...extras];
  }, [previewRows]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              SLA 3 Internal
            </h1>
          </div>
        </div>
      </div>

      <Card className="card-shadow animate-slide-up mb-6">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 md:items-start">
            <div className="flex flex-col gap-4 min-w-0">
              <DateTimePickerField label="Tanggal dan Jam Mulai" value={startParts} onChange={setStartParts} />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex flex-col gap-2 w-full sm:w-[200px] sm:shrink-0">
                  <Label className="text-sm font-medium">Tipe Baterai</Label>
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
                <SiteMultiSelect
                  multiple={false}
                  className="min-w-0 flex-1"
                  options={siteOptions}
                  selectedIds={selectedLoggerIds}
                  onChange={setSelectedLoggerIds}
                  disabled={sitesLoading}
                />
              </div>
            </div>
            <DateTimePickerField label="Tanggal dan Jam Selesai" value={endParts} onChange={setEndParts} />
          </div>
          <div className="flex items-center gap-3">
            <Switch id="apt2" checked={apt2} onCheckedChange={setApt2} />
            <Label htmlFor="apt2" className="cursor-pointer text-sm">
              apt2=true (kolom tambahan sesuai backend)
            </Label>
          </div>
          {sitesLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar site…
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={loadPreview} disabled={loadingPreview || sitesLoading}>
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Muat preview (10 baris)
            </Button>
            <Button variant="default" onClick={downloadAll} disabled={downloading || sitesLoading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Unduh Excel (semua site)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="card-shadow overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border">
            <p className="text-sm text-muted-foreground">
              {previewMeta
                ? `Preview: ${previewMeta.nojs} — ${previewMeta.site} (maks. ${PREVIEW_LIMIT} baris)`
                : 'Klik “Muat preview” setelah memilih filter dan site.'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {activeCols.map((c) => (
                    <TableHead key={c.key} className="whitespace-nowrap text-xs font-medium">
                      {c.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPreview ? (
                  <TableRow>
                    <TableCell colSpan={activeCols.length || 1} className="text-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : previewRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeCols.length || 1} className="text-center py-12 text-muted-foreground">
                      Belum ada pratinjau
                    </TableCell>
                  </TableRow>
                ) : (
                  previewRows.map((row, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      {activeCols.map((c) => (
                        <TableCell key={c.key} className="text-xs whitespace-nowrap max-w-[200px] truncate">
                          {String(row[c.key] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlaInternal3Page;
