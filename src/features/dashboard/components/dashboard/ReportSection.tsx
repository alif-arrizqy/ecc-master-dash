import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { SLAReportDetail } from '@/shared/types/api';

interface GAMASHistoryItem {
  date: string;
  description: string;
  affectedSites: number;
}

interface ReportSectionProps {
  reportData?: SLAReportDetail;
  gamasHistory?: GAMASHistoryItem[];
}

const ReportSection = ({ reportData, gamasHistory = [] }: ReportSectionProps) => {
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
    
    let reportText = `LAPORAN SLA SUNDAYA - ${dateNow}\n\n`;
    reportText += `${report.message}\n`;
    reportText += `${dateBefore} = ${report.slaBefore.toFixed(2)}%\n`;
    reportText += `${dateNow} = ${report.slaNow.toFixed(2)}%\n\n`;
    reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;


    // Helper function to format battery version section
    const formatBatterySection = (
      batteryData: typeof report.detail.batteryVersion.talis5,
      batteryName: string
    ) => {
      // Add null/undefined checks
      if (!batteryData || !batteryData.summary) {
        return `*${batteryName.toUpperCase()}* - Data tidak tersedia\n\n`;
      }

      const totalSites = batteryData.summary.totalSites || 0;
      const sla = batteryData.summary.sla || 0;
      const message = batteryData.message || '';

      let section = `*${batteryName.toUpperCase()} (${totalSites} Site)*\n`;
      if (message) {
        section += `${message}\n`;
      }
      section += `SLA Average: ${sla.toFixed(2)}%\n\n`;

      // Down SLA (SLA = 0%)
      if (batteryData.downSla && batteryData.downSla.length > 0) {
        section += `*SITE DENGAN SLA = 0% (DOWN) - Total: ${batteryData.downSla.length} site:*\n`;
        batteryData.downSla.forEach(site => {
          const problem = site.problem ? ` - ${site.problem}` : '';
          section += `  • ${site.site} - ${site.downtime || ''}${problem}\n`;
        });
        section += `\n`;
      }

      // Under SLA (< 95.5%)
      if (batteryData.underSla && batteryData.underSla.length > 0) {
        section += `*SITE DENGAN SLA < 95.5% - Total: ${batteryData.underSla.length} site:*\n`;
        batteryData.underSla.forEach(site => {
          const slaValue = typeof site.sla === 'number' ? site.sla.toFixed(2) : 'N/A';
          const problem = site.problem ? ` - ${site.problem}` : '';
          section += `  • ${site.site} - ${slaValue}% (${site.downtime || ''})${problem}\n`;
        });
        section += `\n`;
      }

      // Drop SLA
      if (batteryData.dropSla && batteryData.dropSla.length > 0) {
        section += `*PENURUNAN SLA - Total: ${batteryData.dropSla.length} site:*\n`;
        batteryData.dropSla.forEach(site => {
          const slaBefore = typeof site.slaBefore === 'number' ? site.slaBefore.toFixed(2) : 'N/A';
          const slaNow = typeof site.slaNow === 'number' ? site.slaNow.toFixed(2) : 'N/A';
          const problem = site.problem ? ` - ${site.problem}` : '';
          section += `  • ${site.site} (${slaBefore}% → ${slaNow}%) - ${site.downtime || ''}${problem}\n`;
        });
        section += `\n`;
      }

      // Up SLA
      if (batteryData.upSla && batteryData.upSla.length > 0) {
        section += `*KENAIKAN SLA - Total: ${batteryData.upSla.length} site:*\n`;
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
      reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Talis5 Mix
    const mixData = report.detail.batteryVersion?.mix;
    if (mixData) {
      reportText += formatBatterySection(
        mixData,
        mixData.name || 'Talis5 Mix'
      );
      reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // JSPro
    const jsproData = report.detail.batteryVersion?.jspro;
    if (jsproData) {
      reportText += formatBatterySection(
        jsproData,
        jsproData.name || 'JS PRO'
      );
      reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // GAMAS History (jika ada di tanggal yang sama)
    const reportDate = report.dateNow;
    const sameDateGAMAS = gamasHistory.filter(
      item => formatDate(item.date) === formatDate(reportDate)
    );

    if (sameDateGAMAS.length > 0) {
      reportText += `*HISTORY GAMAS:*\n`;
      sameDateGAMAS.forEach(item => {
        const affectedText = item.affectedSites > 0 
          ? ` (${item.affectedSites} site terdampak)` 
          : '';
        reportText += `  • ${formatDate(item.date)}: ${item.description}${affectedText}\n`;
      });
      reportText += `\n`;
      reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    reportText += `Generated by SLA Dash Sundaya`;

    return reportText;
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
  const handleCopy = async () => {
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
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Report Daily</h3>
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
