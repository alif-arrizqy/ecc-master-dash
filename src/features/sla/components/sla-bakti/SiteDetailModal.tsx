import { useState, useMemo } from 'react';
import { X, Calendar, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Site, Problem } from '@/shared/data/mockData';
import { cn } from '@/shared/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns';

interface SiteDetailModalProps {
  site: Site;
  problems: Problem[];
  onClose: () => void;
}

const SiteDetailModal = ({ site, problems, onClose }: SiteDetailModalProps) => {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Determine the month to use for date labels (same logic as getSLADateRange)
  const monthDates = useMemo(() => {
    const now = new Date();
    const today = now.getDate();
    
    let targetMonth: Date;
    if (today === 1) {
      // Tanggal 1: gunakan bulan sebelumnya
      targetMonth = subMonths(now, 1);
    } else {
      // Tanggal 2+: gunakan bulan saat ini
      targetMonth = now;
    }
    
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
    return eachDayOfInterval({ start, end });
  }, []);

  // Map day number to date
  const getDateForDay = (day: number): Date | null => {
    if (day < 1 || day > monthDates.length) return null;
    return monthDates[day - 1];
  };

  const getSLAColor = (sla: number) => {
    if (sla >= 95.5) return 'text-status-good';
    if (sla >= 90) return 'text-status-warning';
    return 'text-status-danger';
  };

  const getSLABgColor = (sla: number) => {
    if (sla >= 95.5) return 'bg-status-good/10';
    if (sla >= 90) return 'bg-status-warning/10';
    return 'bg-status-danger/10';
  };

  const getPICColor = (pic: Problem['pic']) => {
    switch (pic) {
      case 'VSAT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'SNMP': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Power': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  // Get tooltip position class based on day
  const getTooltipPositionClass = (day: number) => {
    if (day <= 3) return 'left-0 translate-x-0';
    if (day >= 29) return 'right-0 translate-x-0';
    return 'left-1/2 -translate-x-1/2';
  };

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
              <span className="text-primary font-bold text-sm">
                {site.siteName.replace('Site ', '')}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{site.siteName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-medium",
                  site.batteryVersion === 'Talis5 Full' && "bg-battery-talis5FullLight text-battery-talis5Full",
                  site.batteryVersion === 'Talis5 Mix' && "bg-battery-talis5MixLight text-battery-talis5Mix",
                  site.batteryVersion === 'JS PRO' && "bg-battery-jsproLight text-battery-jspro",
                )}>
                  {site.batteryVersion}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{site.province}</span>
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
            {/* SLA Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("p-4 rounded-xl border border-border/50", getSLABgColor(site.slaAvg))}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">SLA Average</p>
                <p className={cn("text-3xl font-bold", getSLAColor(site.slaAvg))}>
                  {site.slaAvg.toFixed(2)}%
                </p>
              </div>
              <div className={cn(
                "p-4 rounded-xl border border-border/50",
                site.status === 'Potensi SP' ? 'bg-status-warning/10' : 'bg-status-good/10'
              )}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                <p className={cn(
                  "text-xl font-bold",
                  site.status === 'Potensi SP' ? 'text-status-warning' : 'text-status-good'
                )}>
                  {site.status}
                </p>
              </div>
            </div>

            {/* Daily SLA Chart */}
            <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4">Daily SLA</h3>
              
              {/* Chart Container with padding for tooltip */}
              <div className="relative px-2">
                {/* Tooltip Display - Fixed Position */}
                <div className="h-8 mb-2 flex items-center justify-center">
                  {hoveredDay !== null && (() => {
                    const date = getDateForDay(hoveredDay);
                    const dayData = site.dailySla.find(d => d.day === hoveredDay);
                    const sla = dayData?.sla;
                    const hasData = dayData !== undefined;
                    return (
                      <div className="bg-foreground text-background text-xs px-3 py-1.5 rounded-md font-medium animate-fade-in">
                        {date ? format(date, 'dd MMM') : `Day ${hoveredDay}`}: {hasData ? `${sla?.toFixed(1)}%` : 'No data'}
                      </div>
                    );
                  })()}
                </div>

                {/* Bars */}
                <div className="flex gap-[2px] h-20 items-end">
                  {monthDates.map((date, index) => {
                    const day = index + 1;
                    const dayData = site.dailySla.find(d => d.day === day);
                    const sla = dayData?.sla ?? 0;
                    const hasData = dayData !== undefined;
                    
                    return (
                      <div
                        key={day}
                        className="flex-1 min-w-0 cursor-pointer"
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <div
                          className={cn(
                            "w-full rounded-t transition-all duration-150",
                            hoveredDay === day ? 'opacity-100 scale-x-110' : 'opacity-80 hover:opacity-100',
                            !hasData ? 'bg-muted/30' : sla >= 95.5 ? 'bg-status-good' : sla >= 90 ? 'bg-status-warning' : 'bg-status-danger'
                          )}
                          style={{ 
                            height: hasData 
                              ? `${Math.max(8, (sla - 70) * 2.5)}px` 
                              : '2px'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* X-axis Labels */}
                <div className="flex gap-[2px] mt-2 text-xs text-muted-foreground px-1">
                  {monthDates.map((date, index) => {
                    const day = index + 1;
                    return (
                      <div key={day} className="flex-1 min-w-0 text-center">
                        <span className="text-[10px]">
                          {format(date, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-status-good" />
                  <span className="text-xs text-muted-foreground">≥95.5%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-status-warning" />
                  <span className="text-xs text-muted-foreground">90-95.5%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-status-danger" />
                  <span className="text-xs text-muted-foreground">&lt;90%</span>
                </div>
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
                      key={problem.id}
                      className="bg-muted/20 rounded-xl p-4 border border-border/50 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {problem.problem}
                          </span>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getPICColor(problem.pic))}>
                          {problem.pic}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground">Date:</span>
                          <span className="text-foreground font-medium">
                            {format(new Date(problem.date), 'dd MMM yyyy')}
                          </span>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">Notes:</span>
                          <span className="text-foreground">{problem.notes}</span>
                        </div>
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

export default SiteDetailModal;

