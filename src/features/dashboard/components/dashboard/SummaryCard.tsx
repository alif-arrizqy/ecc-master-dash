import { cn } from "@/shared/lib/utils";
import { Battery, BatteryCharging, Zap, LayoutGrid } from "lucide-react";

interface SummaryCardProps {
  title: string;
  totalSites: number;
  avgSLA: number;
  variant: 'talis5Full' | 'talis5Mix' | 'jsPro' | 'total';
}

const variantStyles = {
  talis5Full: {
    gradient: 'gradient-talis5-full',
    bgLight: 'bg-battery-talis5FullLight',
    text: 'text-battery-talis5Full',
    icon: Battery,
  },
  talis5Mix: {
    gradient: 'gradient-talis5-mix',
    bgLight: 'bg-battery-talis5MixLight',
    text: 'text-battery-talis5Mix',
    icon: BatteryCharging,
  },
  jsPro: {
    gradient: 'gradient-jspro',
    bgLight: 'bg-battery-jsproLight',
    text: 'text-battery-jspro',
    icon: Zap,
  },
  total: {
    gradient: 'gradient-primary',
    bgLight: 'bg-battery-totalLight',
    text: 'text-battery-total',
    icon: LayoutGrid,
  },
};

const SummaryCard = ({ title, totalSites, avgSLA, variant }: SummaryCardProps) => {
  const styles = variantStyles[variant];
  const Icon = styles.icon;
  const isGoodSLA = avgSLA >= 95.5;
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow stat-card animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg", styles.bgLight)}>
          <Icon className={cn("h-6 w-6", styles.text)} />
        </div>
        <span className={cn(
          "text-xs font-medium px-2.5 py-1 rounded-full",
          isGoodSLA 
            ? "bg-status-good/10 text-status-good" 
            : "bg-status-warning/10 text-status-warning"
        )}>
          {isGoodSLA ? 'Target Tercapai' : 'Di Bawah Target'}
        </span>
      </div>
      
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      
      <div className="flex items-end gap-4 mt-3">
        <div>
          <p className="text-3xl font-bold text-foreground">{avgSLA.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">AVG SLA</p>
        </div>
        <div className="mb-1">
          <p className="text-lg font-semibold text-foreground">{totalSites}</p>
          <p className="text-xs text-muted-foreground">Total Site</p>
        </div>
      </div>
      
      <div className={cn("h-1 rounded-full mt-4", styles.bgLight)}>
        <div 
          className={cn("h-full rounded-full transition-all duration-500", styles.gradient)}
          style={{ width: `${Math.min(avgSLA, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default SummaryCard;
