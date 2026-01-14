import { X, Calendar, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SiteDownWithStatus, SiteUp } from '../types/monitoring.types';
import { cn } from '@/shared/lib/utils';
import { format } from 'date-fns';

interface MonitoringSiteDetailModalProps {
  site: SiteDownWithStatus | SiteUp;
  type: 'down' | 'up';
  onClose: () => void;
}

const MonitoringSiteDetailModal = ({ site, type, onClose }: MonitoringSiteDetailModalProps) => {
  const isDown = type === 'down';
  const siteDown = isDown ? (site as SiteDownWithStatus) : null;
  const siteUp = !isDown ? (site as SiteUp) : null;

  const getSLAColor = (sla?: number) => {
    if (!sla) return 'text-muted-foreground';
    if (sla >= 95.5) return 'text-status-good';
    if (sla >= 90) return 'text-status-warning';
    if (sla >= 80) return 'text-orange-600 dark:text-orange-500';
    return 'text-status-danger';
  };

  const getSLABgColor = (sla?: number) => {
    if (!sla) return 'bg-muted/20';
    if (sla >= 95.5) return 'bg-status-good/10';
    if (sla >= 90) return 'bg-status-warning/10';
    if (sla >= 80) return 'bg-orange-50 dark:bg-orange-950/20';
    return 'bg-status-danger/10';
  };

  const getSLAStatus = (sla?: number): 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad' => {
    if (!sla) return 'Very Bad';
    if (sla >= 95.5) return 'Meet SLA';
    if (sla >= 90) return 'Fair';
    if (sla >= 80) return 'Bad';
    return 'Very Bad';
  };

  const getSLAStatusColor = (status: 'Meet SLA' | 'Fair' | 'Bad' | 'Very Bad') => {
    switch (status) {
      case 'Meet SLA':
        return 'bg-status-good/10 text-status-good';
      case 'Fair':
        return 'bg-status-warning/10 text-status-warning';
      case 'Bad':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Very Bad':
        return 'bg-status-danger/10 text-status-danger';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const slaStatus = site.statusSLA || getSLAStatus(site.slaAvg);
  const problems = site.problem || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border animate-scale-in max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className={cn(
                "h-5 w-5",
                isDown ? "text-destructive" : "text-status-good"
              )} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{site.siteName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{site.siteId}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  isDown ? "bg-destructive/10 text-destructive" : "bg-status-good/10 text-status-good"
                )}>
                  {isDown ? 'Site Down' : 'Site Up'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content with ScrollArea */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-4 rounded-xl border border-border/50", getSLABgColor(site.slaAvg))}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">SLA Average</p>
                <p className={cn("text-3xl font-bold", getSLAColor(site.slaAvg))}>
                  {site.slaAvg ? `${site.slaAvg.toFixed(2)}%` : '-'}
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border border-border/50",
                getSLAStatusColor(slaStatus)
              )}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status SLA</p>
                <p className={cn(
                  "text-xl font-bold",
                  getSLAColor(site.slaAvg)
                )}>
                  {slaStatus}
                </p>
              </div>
            </div>

            {/* Additional Info Cards for Site Down */}
            {isDown && siteDown && (
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "p-4 rounded-xl border border-border/50",
                  siteDown.statusSP === 'Potensi SP' ? 'bg-status-warning/10' : 'bg-status-good/10'
                )}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status SP</p>
                  <p className={cn(
                    "text-xl font-bold",
                    siteDown.statusSP === 'Potensi SP' ? 'text-status-warning' : 'text-status-good'
                  )}>
                    {siteDown.statusSP || 'Clear SP'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                  <p className="text-xl font-bold text-foreground">
                    {siteDown.formattedDuration}
                  </p>
                </div>
              </div>
            )}

            {/* Date Information */}
            <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {isDown ? 'Down Information' : 'Site Information'}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {isDown && siteDown ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Down Since</p>
                      {siteDown.downSince ? (
                        <>
                          <p className="text-sm font-medium text-foreground">
                            {format(new Date(siteDown.downSince), 'dd MMM yyyy, HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {siteDown.formattedDownSince}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(siteDown.updatedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </>
                ) : siteUp ? (
                  <>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Created At</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(siteUp.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(siteUp.updatedAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Problems List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-status-warning" />
                  Problems
                </h3>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold",
                  problems.length > 0 
                    ? "bg-status-danger/10 text-status-danger" 
                    : "bg-status-good/10 text-status-good"
                )}>
                  {problems.length} {problems.length === 1 ? 'issue' : 'issues'}
                </span>
              </div>
              
              {problems.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-xl border border-border/50">
                  <div className="w-12 h-12 rounded-full bg-status-good/10 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-status-good" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Tidak ada problem untuk site ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {problems.map((problem, index) => (
                    <div 
                      key={index}
                      className="bg-muted/20 rounded-xl p-4 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {problem}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MonitoringSiteDetailModal;

