/**
 * Monitoring Summary Component
 * Menampilkan summary cards untuk total sites, sites down, dan sites up
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { MonitoringSummary as MonitoringSummaryType } from '../types/monitoring.types';

interface MonitoringSummaryProps {
  summary: MonitoringSummaryType;
  isLoading?: boolean;
}

export const MonitoringSummary = ({ summary, isLoading }: MonitoringSummaryProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Sites */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Total Sites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div className="text-3xl font-bold">{summary.totalSites}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Semua site aktif</p>
        </CardContent>
      </Card>

      {/* Sites Down */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Sites Down
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div className="text-3xl font-bold text-destructive">{summary.totalSitesDown}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.percentageSitesDown.toFixed(1)}% dari total sites
          </p>
        </CardContent>
      </Card>

      {/* Sites Up */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            Sites Up
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="text-3xl font-bold text-green-600">{summary.totalSitesUp}</div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.percentageSitesUp.toFixed(1)}% dari total sites
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

