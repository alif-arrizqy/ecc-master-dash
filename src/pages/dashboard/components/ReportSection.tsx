import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { SLAReportDetail, SiteMaster } from '@/types/api';

interface GAMASHistoryItem {
  date: string;
  description: string;
  affectedSites: number;
}

interface ReportSectionProps {
  reportData?: SLAReportDetail;
  gamasHistory?: GAMASHistoryItem[];
  potensiSPSites?: SiteMaster[];
}

const ReportSection = ({ reportData, gamasHistory = [], potensiSPSites = [] }: ReportSectionProps) => {
  const [copied, setCopied] = useState(false);
  
  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch {
      return dateString;
    }
  };
  
  const generateReportText = () => {
    if (!reportData) {
      return 'Memuat data laporan...';
    }

    const { report } = reportData;
    const dateNow = formatDate(report.dateNow);
    const dateBefore = formatDate(report.dateBefore);
    
    let reportText = `📊 LAPORAN SLA SUNDAYA - ${dateNow}\n\n`;
    reportText += `${report.message}\n`;
    reportText += `${dateBefore} = ${report.slaBefore.toFixed(2)}%\n`;
    reportText += `${dateNow} = ${report.slaNow.toFixed(2)}%\n\n`;
    reportText += `${'━'.repeat(42)}\n\n`;


    // Helper function to format battery version section
    const formatBatterySection = (
      batteryData: typeof report.detail.batteryVersion.talis5,
      batteryName: string
    ) => {
      // Add null/undefined checks
      if (!batteryData || !batteryData.summary) {
        return `📈 ${batteryName.toUpperCase()} - Data tidak tersedia\n\n`;
      }

      const totalSites = batteryData.summary.totalSites || 0;
      const sla = batteryData.summary.sla || 0;
      const message = batteryData.message || '';

      let section = `📈 ${batteryName.toUpperCase()} (${totalSites} Site)\n`;
      if (message) {
        section += `${message}\n`;
      }
      section += `SLA Average: ${sla.toFixed(2)}%\n\n`;

      // Down SLA (SLA = 0%)
      if (batteryData.downSla && batteryData.downSla.length > 0) {
        section += `⚠️ SITE DENGAN SLA = 0% (DOWN) - Total: ${batteryData.downSla.length} site:\n`;
        batteryData.downSla.forEach(site => {
          section += `  • ${site.site} - ${site.downtime || ''} - ${site.problem || ''}\n`;
        });
        section += `\n`;
      }

      // Under SLA (< 95.5%)
      if (batteryData.underSla && batteryData.underSla.length > 0) {
        section += `⚠️ SITE DENGAN SLA < 95.5% - Total: ${batteryData.underSla.length} site:\n`;
        batteryData.underSla.forEach(site => {
          const slaValue = typeof site.sla === 'number' ? site.sla.toFixed(2) : 'N/A';
          section += `  • ${site.site} - ${slaValue}% (${site.downtime || ''}) - ${site.problem || ''}\n`;
        });
        section += `\n`;
      }

      // Drop SLA
      if (batteryData.dropSla && batteryData.dropSla.length > 0) {
        section += `📉 PENURUNAN SLA - Total: ${batteryData.dropSla.length} site:\n`;
        batteryData.dropSla.forEach(site => {
          const slaBefore = typeof site.slaBefore === 'number' ? site.slaBefore.toFixed(2) : 'N/A';
          const slaNow = typeof site.slaNow === 'number' ? site.slaNow.toFixed(2) : 'N/A';
          section += `  • ${site.site} (${slaBefore}% → ${slaNow}%) - ${site.downtime || ''} - ${site.problem || ''}\n`;
        });
        section += `\n`;
      }

      // Up SLA
      if (batteryData.upSla && batteryData.upSla.length > 0) {
        section += `📈 KENAIKAN SLA - Total: ${batteryData.upSla.length} site:\n`;
        batteryData.upSla.forEach(site => {
          const slaBefore = typeof site.slaBefore === 'number' ? site.slaBefore.toFixed(2) : 'N/A';
          const slaNow = typeof site.slaNow === 'number' ? site.slaNow.toFixed(2) : 'N/A';
          section += `  • ${site.site} (${slaBefore}% → ${slaNow}%)\n`;
        });
        section += `\n`;
      }

      return section;
    };

    // Talis5 Full
    const talis5Data = report.detail.batteryVersion?.talis5;
    if (talis5Data) {
      reportText += formatBatterySection(
        talis5Data,
        talis5Data.name || 'Talis5 Full'
      );
      reportText += `${'━'.repeat(42)}\n\n`;
    }

    // Talis5 Mix
    const mixData = report.detail.batteryVersion?.mix;
    if (mixData) {
      reportText += formatBatterySection(
        mixData,
        mixData.name || 'Talis5 Mix'
      );
      reportText += `${'━'.repeat(42)}\n\n`;
    }

    // JSPro
    const jsproData = report.detail.batteryVersion?.jspro;
    if (jsproData) {
      reportText += formatBatterySection(
        jsproData,
        jsproData.name || 'JS PRO'
      );
      reportText += `${'━'.repeat(42)}\n\n`;
    }

    // Potensi SP Sites
    
    // Handle case where potensiSPSites might be an object with 'sites' property
    let validPotensiSPSites: SiteMaster[] = [];
    if (Array.isArray(potensiSPSites)) {
      validPotensiSPSites = potensiSPSites;
    } else if (potensiSPSites && typeof potensiSPSites === 'object' && 'sites' in potensiSPSites) {
      // Handle case where the entire response object was passed instead of just sites array
      const responseObj = potensiSPSites as { sites?: SiteMaster[] };
      validPotensiSPSites = Array.isArray(responseObj.sites) ? responseObj.sites : [];
    }
    
    if (validPotensiSPSites.length > 0) {
      // Group by battery version
      const groupedByBattery: Record<string, Array<{ siteName: string; slaAvg?: number }>> = {
        'Talis5 Full': [],
        'Talis5 Mix': [],
        'JS PRO': [],
        'Other': [],
      };

      validPotensiSPSites.forEach(site => {
        // Handle different possible field names from API
        const siteObj = site as Record<string, unknown>;
        const siteName = String(
          site.siteName || 
          siteObj.name || 
          siteObj.site_name || 
          siteObj.siteName || 
          'Unknown Site'
        );
        const batteryVersion = String(
          site.batteryVersion || 
          siteObj.battery_version || 
          siteObj.batteryVersion || 
          'Other'
        ).toLowerCase();
        
        // Get SLA average from siteSla object (new structure) or fallback to legacy fields
        let slaAvg: number | undefined;
        if (site.siteSla && typeof site.siteSla === 'object' && 'slaAverage' in site.siteSla) {
          const siteSlaObj = site.siteSla as { slaAverage?: number };
          slaAvg = typeof siteSlaObj.slaAverage === 'number' ? siteSlaObj.slaAverage : undefined;
        } else if (site.slaAvg !== undefined) {
          slaAvg = site.slaAvg;
        } else if (typeof siteObj.sla_avg === 'number') {
          slaAvg = siteObj.sla_avg;
        } else if (typeof siteObj.slaAvg === 'number') {
          slaAvg = siteObj.slaAvg;
        }

        const normalizedSite = {
          siteName,
          slaAvg,
        };

        if (batteryVersion.includes('talis5 full') || batteryVersion === 'talis5') {
          groupedByBattery['Talis5 Full'].push(normalizedSite);
        } else if (batteryVersion.includes('talis5 mix') || batteryVersion === 'mix') {
          groupedByBattery['Talis5 Mix'].push(normalizedSite);
        } else if (batteryVersion.includes('jspro') || batteryVersion === 'jspro' || batteryVersion.includes('js pro')) {
          groupedByBattery['JS PRO'].push(normalizedSite);
        } else {
          groupedByBattery['Other'].push(normalizedSite);
        }
      });

      reportText += `⚠️ SITE DENGAN POTENSI SP - Total: ${validPotensiSPSites.length} site:\n\n`;

      // Helper function to format SLA value
      const formatSLA = (sla: number | undefined): string => {
        if (sla === undefined || isNaN(sla)) {
          return ' - N/A';
        }
        // Format: if 0, show as "0 %", otherwise show with 2 decimals
        if (sla === 0) {
          return ' - 0 %';
        }
        return ` - ${sla.toFixed(2)} %`;
      };

      // Talis5 Full
      if (groupedByBattery['Talis5 Full'].length > 0) {
        reportText += `Talis5 Full (${groupedByBattery['Talis5 Full'].length} site):\n\n`;
        groupedByBattery['Talis5 Full'].forEach(site => {
          reportText += `  • ${site.siteName}${formatSLA(site.slaAvg)}\n`;
        });
        reportText += `\n`;
      }

      // Talis5 Mix
      if (groupedByBattery['Talis5 Mix'].length > 0) {
        reportText += `Talis5 Mix (${groupedByBattery['Talis5 Mix'].length} site):\n\n`;
        groupedByBattery['Talis5 Mix'].forEach(site => {
          reportText += `  • ${site.siteName}${formatSLA(site.slaAvg)}\n`;
        });
        reportText += `\n`;
      }

      // JS PRO
      if (groupedByBattery['JS PRO'].length > 0) {
        reportText += `JS PRO (${groupedByBattery['JS PRO'].length} site):\n\n`;
        groupedByBattery['JS PRO'].forEach(site => {
          reportText += `  • ${site.siteName}${formatSLA(site.slaAvg)}\n`;
        });
        reportText += `\n`;
      }

      // Other (jika ada)
      if (groupedByBattery['Other'].length > 0) {
        reportText += `Other (${groupedByBattery['Other'].length} site):\n\n`;
        groupedByBattery['Other'].forEach(site => {
          reportText += `  • ${site.siteName}${formatSLA(site.slaAvg)}\n`;
        });
        reportText += `\n`;
      }

      reportText += `${'━'.repeat(42)}\n\n`;
    }

    // GAMAS History (jika ada di tanggal yang sama)
    const reportDate = report.dateNow;
    const sameDateGAMAS = gamasHistory.filter(
      item => formatDate(item.date) === formatDate(reportDate)
    );

    if (sameDateGAMAS.length > 0) {
      reportText += `🚨 HISTORY GAMAS:\n`;
      sameDateGAMAS.forEach(item => {
        const affectedText = item.affectedSites > 0 
          ? ` (${item.affectedSites} site terdampak)` 
          : '';
        reportText += `  • ${formatDate(item.date)}: ${item.description}${affectedText}\n`;
      });
      reportText += `\n`;
      reportText += `${'━'.repeat(42)}\n\n`;
    }

    reportText += `Generated by SLA Dash Sundaya`;

    return reportText;
  };
  
  const handleCopy = async () => {
    const reportText = generateReportText();
    
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success('Laporan berhasil disalin!', {
        description: 'Anda dapat paste laporan ini'
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Gagal menyalin laporan');
    }
  };
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Laporan Ringkas</h3>
        </div>
        
        <Button 
          onClick={handleCopy}
          variant="default"
          size="sm"
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Tersalin!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Salin Laporan
            </>
          )}
        </Button>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
        {generateReportText()}
      </div>
    </div>
  );
};

export default ReportSection;
