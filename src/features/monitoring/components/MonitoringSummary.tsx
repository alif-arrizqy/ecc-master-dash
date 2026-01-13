/**
 * Monitoring Summary Component
 * Menampilkan summary cards untuk total sites, sites down, dan sites up
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import { MonitoringSummary as MonitoringSummaryType } from '../types/monitoring.types';
import { cn } from '@/lib/utils';

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
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24"></div>
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.totalSites}</div>
          <p className="text-xs text-muted-foreground">Semua site aktif</p>
        </CardContent>
      </Card>

      {/* Sites Down */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sites Down</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {summary.totalSitesDown}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.percentageSitesDown.toFixed(1)}% dari total sites
          </p>
        </CardContent>
      </Card>

      {/* Sites Up */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sites Up</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {summary.totalSitesUp}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.percentageSitesUp.toFixed(1)}% dari total sites
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

