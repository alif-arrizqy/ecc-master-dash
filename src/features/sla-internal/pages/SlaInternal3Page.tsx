import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePickerField, combineDateTime, type DateTimeParts } from '../components/DateTimePickerField';
import { SiteMultiSelect } from '../components/SiteMultiSelect';
import type { SlaInternalBattery, ResolvedLoggerSite } from '../lib/resolve-logger-sites';
import { resolveLoggerSites } from '../lib/resolve-logger-sites';
import { toSlaInternalQueryTimestamp } from '../lib/to-sla-query-timestamp';
import { fetchSla3ExportBlob } from '../services/sla-internal.api';
import { triggerBlobDownload } from '../lib/excel-utils';

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

const SlaInternal3Page = () => {
  const [battery, setBattery] = useState<SlaInternalBattery>('JSPRO');
  const [startParts, setStartParts] = useState<DateTimeParts>(startPartsDefault);
  const [endParts, setEndParts] = useState<DateTimeParts>(endPartsDefault);
  const [siteOptions, setSiteOptions] = useState<ResolvedLoggerSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [selectedLoggerIds, setSelectedLoggerIds] = useState<number[]>([]);
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

  const downloadExcel = async () => {
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
        dataSource: s.dataSource,
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
          {sitesLoading && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar site…
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="default" onClick={downloadExcel} disabled={downloading || sitesLoading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Unduh Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SlaInternal3Page;
