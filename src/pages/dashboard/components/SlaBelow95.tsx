import { useState } from 'react';
import { Copy, Check, TriangleAlert  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SlaBelow95Section } from '@/types/api';
import { format, parse } from 'date-fns';
import { id } from 'date-fns/locale';

interface PotensiSPSectionProps {
  slaBelow95Data?: SlaBelow95Section;
  isLoading?: boolean;
}

const PotensiSPSection = ({ slaBelow95Data, isLoading = false }: PotensiSPSectionProps) => {
  const [copied, setCopied] = useState(false);

  // Group sites by battery version from slaBelow95Data
  const groupedSites = slaBelow95Data ? {
    talis5: slaBelow95Data.detail.batteryVersion.talis5.sites || [],
    mix: slaBelow95Data.detail.batteryVersion.mix.sites || [],
    jspro: slaBelow95Data.detail.batteryVersion.jspro.sites || [],
  } : {
    talis5: [],
    mix: [],
    jspro: [],
  };

  const totalSites = slaBelow95Data?.totalSites || 0;

  // Format SLA percentage
  const formatSLA = (sla: number): string => {
    return `${sla.toFixed(2)}%`;
  };

  // Format problem text
  const formatProblem = (problem: string | null): string => {
    if (!problem) return '';
    return problem;
  };

  // Generate report text
  const generateReportText = (): string => {
    if (!slaBelow95Data) {
      return 'Memuat data...';
    }

    // Extract date from message to get month and year
    // Message format: "Dear team, berikut site yang memiliki SLA avg dibawah 95.5% pada tanggal 2026-01-11"
    const dateMatch = slaBelow95Data.message.match(/(\d{4}-\d{2}-\d{2})/);
    let monthYear = 'JANUARI 2026'; // Default fallback
    if (dateMatch) {
      try {
        const dateObj = parse(dateMatch[1], 'yyyy-MM-dd', new Date());
        const monthNames = [
          'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
          'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
        ];
        const monthIndex = dateObj.getMonth();
        const year = dateObj.getFullYear();
        monthYear = `${monthNames[monthIndex]} ${year}`;
      } catch (e) {
        // Fallback if parsing fails
        monthYear = 'JANUARI 2026';
      }
    }

    // Header
    let report = `LAPORAN SLA SUNDAYA DI BAWAH TARGET 95.5% BULAN ${monthYear}\n\n`;
    report += `${slaBelow95Data.message}\n\n`;

    // Calculate Potensi SP and Clear SP counts
    let potensiSPCount = 0;
    let clearSPCount = 0;
    const allSites = [
      ...slaBelow95Data.detail.batteryVersion.talis5.sites,
      ...slaBelow95Data.detail.batteryVersion.mix.sites,
      ...slaBelow95Data.detail.batteryVersion.jspro.sites,
    ];
    allSites.forEach(site => {
      if (site.statusSP === 'Potensi SP') {
        potensiSPCount++;
      } else {
        clearSPCount++;
      }
    });

    // Summary
    report += `  *SUMMARY*\n`;
    report += `  • Total Site: ${totalSites} site\n`;
    report += `  Potensi SP: ${potensiSPCount} site\n`;
    report += `  Clear SP: ${clearSPCount} site\n\n`;

    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // Helper to format site line (without statusSP at the end)
    const formatSiteLine = (site: { site: string; sla: number; downtime: string; problem: string | null }) => {
      const problem = formatProblem(site.problem);
      const problemText = problem ? ` - ${problem}` : '';
      // Only include downtime if it's not empty
      const downtimeText = site.downtime && site.downtime.trim() !== '' ? ` - ${site.downtime}` : '';
      return `    • ${site.site} - ${formatSLA(site.sla)}${downtimeText}${problemText}\n`;
    };

    // Helper to format battery version section
    const formatBatteryVersionSection = (
      batteryData: { name: string; totalSites: number; sites: Array<{ site: string; sla: number; downtime: string; problem: string | null; statusSP: "Potensi SP" | "Clear SP" }> }
    ) => {
      if (batteryData.sites.length === 0) return '';

      let section = `*${batteryData.name.toUpperCase()} (${batteryData.totalSites} site)*\n\n`;

      // Group sites by statusSP
      const potensiSPSites = batteryData.sites.filter(site => site.statusSP === 'Potensi SP');
      const clearSPSites = batteryData.sites.filter(site => site.statusSP === 'Clear SP');

      // Potensi SP section
      if (potensiSPSites.length > 0) {
        section += `*POTENSI SP (${potensiSPSites.length} site):*\n`;
        potensiSPSites.forEach(site => {
          section += formatSiteLine(site);
        });
        section += '\n';
      }

      // Clear SP section
      if (clearSPSites.length > 0) {
        section += `*CLEAR SP* (${clearSPSites.length} site):\n`;
        clearSPSites.forEach(site => {
          section += formatSiteLine(site);
        });
        section += '\n';
      }

      return section;
    };

    // Talis5 Full
    const talis5Data = slaBelow95Data.detail.batteryVersion.talis5;
    report += formatBatteryVersionSection(talis5Data);
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // Talis5 Mix
    const mixData = slaBelow95Data.detail.batteryVersion.mix;
    report += formatBatteryVersionSection(mixData);
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    // JS Pro
    const jsproData = slaBelow95Data.detail.batteryVersion.jspro;
    report += formatBatteryVersionSection(jsproData);
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    report += 'Generated by SLA Dash Sundaya\n';

    return report;
  };

  // Helper: Menampilkan success notification dan update state
  const showCopySuccess = (method: string) => {
    console.log(`✅ Berhasil menyalin laporan menggunakan metode: ${method}`);
    setCopied(true);
    toast.success('Laporan berhasil disalin!', {
      description: 'Anda dapat paste laporan ini'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper: Membuat hidden textarea untuk copy
  const createHiddenTextarea = (text: string): HTMLTextAreaElement => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.setAttribute('aria-hidden', 'true');
    
    Object.assign(textArea.style, {
      position: 'fixed',
      top: '-9999px',
      left: '-9999px',
      opacity: '0',
      pointerEvents: 'none',
    });
    
    return textArea;
  };

  // Helper: Select text dengan kompatibilitas iOS
  const selectText = (textArea: HTMLTextAreaElement) => {
    const isIOS = /ipad|iphone/i.test(navigator.userAgent);
    
    if (isIOS) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
      textArea.setSelectionRange(0, 999999);
    }
  };

  // Helper: Copy menggunakan Clipboard API (HTTPS)
  const copyWithClipboardAPI = async (text: string): Promise<boolean> => {
    if (!navigator.clipboard || !window.isSecureContext) {
      console.log('⚠️ Clipboard API tidak tersedia (tidak secure context atau browser tidak support)');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Clipboard API berhasil menyalin teks');
      return true;
    } catch (err) {
      console.error('❌ Clipboard API error:', err);
      return false;
    }
  };

  // Helper: Copy menggunakan execCommand (HTTP fallback)
  const copyWithExecCommand = (text: string): boolean => {
    const textArea = createHiddenTextarea(text);
    document.body.appendChild(textArea);
    
    try {
      selectText(textArea);
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('✅ execCommand berhasil menyalin teks');
      } else {
        console.warn('⚠️ execCommand mengembalikan false');
      }
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      console.error('❌ execCommand error:', err);
      return false;
    }
  };

  // Helper: Fallback manual - tampilkan textarea untuk user copy manual
  const showManualCopyFallback = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    Object.assign(textArea.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      height: '200px',
      zIndex: '9999',
      border: '2px solid #ccc',
      padding: '10px',
      fontSize: '14px',
      backgroundColor: '#fff',
    });
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    toast.error('Salin manual diperlukan', {
      description: 'Teks telah dipilih, tekan Ctrl+C (Cmd+C di Mac) untuk menyalin',
      duration: 5000
    });
    
    setTimeout(() => {
      if (document.body.contains(textArea)) {
        document.body.removeChild(textArea);
      }
    }, 5000);
  };

  // Main handler: Mencoba berbagai metode copy secara berurutan
  const handleCopyReport = async () => {
    const reportText = generateReportText();
    console.log('📋 Memulai proses menyalin laporan...', {
      textLength: reportText.length,
      isSecureContext: window.isSecureContext,
      clipboardAvailable: !!navigator.clipboard
    });
    
    // Method 1: Clipboard API (HTTPS)
    if (await copyWithClipboardAPI(reportText)) {
      showCopySuccess('Clipboard API');
      return;
    }
    
    // Method 2: execCommand (HTTP fallback)
    if (copyWithExecCommand(reportText)) {
      showCopySuccess('execCommand');
      return;
    }
    
    // Method 3: Manual fallback
    console.error('❌ Semua metode copy gagal, menggunakan fallback manual');
    showManualCopyFallback(reportText);
    toast.error('Gagal menyalin laporan', {
      description: 'Mohon salin manual dari teks di bawah ini'
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-status-warning" />
            <h3 className="text-lg font-semibold text-foreground">SLA Below &lt; 95.5%</h3>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground">
          Memuat data...
        </div>
      </div>
    );
  }

  if (!slaBelow95Data || totalSites === 0) {
    return (
      <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-status-warning" />
            <h3 className="text-lg font-semibold text-foreground">SLA Below &lt; 95.5%</h3>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs text-muted-foreground">
          Tidak ada site dengan SLA avg dibawah 95.5%
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-5 w-5 text-status-warning" />
          <h3 className="text-lg font-semibold text-foreground">SLA Below &lt; 95.5%</h3>
        </div>
        
        <Button 
          onClick={handleCopyReport}
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

export default PotensiSPSection;
