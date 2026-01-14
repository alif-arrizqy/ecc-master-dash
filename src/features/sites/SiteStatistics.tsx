/**
 * Site Statistics Component
 * Displays summary and statistics for sites
 */

import { BarChart3, Battery, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SiteStatistics as SiteStatisticsType } from '../types';

interface SiteStatisticsProps {
  data: SiteStatisticsType | undefined;
  isLoading: boolean;
  error: Error | null;
}

const RegionStatistics = ({
  regionName,
  regionData,
}: {
  regionName: string;
  regionData: SiteStatisticsType['maluku'] | SiteStatisticsType['papua'];
}) => {
  return (
    <Card className="card-shadow animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          {regionName} Region
        </CardTitle>
        <CardDescription>Statistik sites di wilayah {regionName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Site */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Total Sites
          </h4>
          <div className="text-center p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="text-4xl font-bold text-primary">{regionData.totalSite.all}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Sites</div>
          </div>
        </div>

        {/* By Province */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            By Province
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {regionData.byProvince.map((prov) => (
              <div
                key={prov.province}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <span className="text-sm font-medium">{prov.province}</span>
                <span className="text-sm font-bold text-primary">{prov.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Status Sites */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            By Status Sites
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(regionData.byStatusSites).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <span className="text-sm font-medium capitalize">
                  {status.replace('_', ' ')}
                </span>
                <span className="text-sm font-bold text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By SCC Type */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            By SCC Type
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(regionData.bySccType).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted/70 transition-colors"
              >
                <span className="text-sm font-medium uppercase">{type.replace('_', ' ')}</span>
                <span className="text-sm font-bold text-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Battery Version with Sites */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Battery className="h-4 w-4" />
            By Battery Version
          </h4>
          <Accordion type="multiple" className="w-full">
            {Object.entries(regionData.byBatteryVersion).map(([version, data]) => (
              <AccordionItem key={version} value={version} className="border rounded-lg mb-2">
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold capitalize">{version}</span>
                      <span className="text-xs text-muted-foreground">
                        ({data.summary.total} sites)
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Daftar {data.summary.total} sites:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {data.sites.map((site) => (
                        <div
                          key={site.siteId}
                          className="flex items-center gap-2 p-2 rounded bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-xs font-mono font-semibold text-primary">
                            {site.siteId}
                          </span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="text-xs">{site.siteName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
};

export const SiteStatistics = ({ data, isLoading, error }: SiteStatisticsProps) => {
  if (isLoading) {
    return (
      <Card className="card-shadow animate-slide-up">
        <CardHeader>
          <CardTitle>Site Statistics</CardTitle>
          <CardDescription>Ringkasan data sites</CardDescription>
        </CardHeader>
        <CardContent>
          <Loading />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="card-shadow animate-slide-up">
        <CardHeader>
          <CardTitle>Site Statistics</CardTitle>
          <CardDescription>Ringkasan data sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p className="font-semibold">Error memuat statistics</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, maluku, papua } = data;
  const totalSites = summary.talis5.totalSites + summary.mix.totalSites + summary.jspro.totalSites;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="card-shadow animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-3xl font-bold">{totalSites}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Talis5 Full</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-blue-500" />
              <div className="text-3xl font-bold">{summary.talis5.totalSites}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Talis5 Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-green-500" />
              <div className="text-3xl font-bold">{summary.mix.totalSites}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow animate-slide-up">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">JS PRO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Battery className="h-5 w-5 text-purple-500" />
              <div className="text-3xl font-bold">{summary.jspro.totalSites}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Region Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegionStatistics regionName="Maluku" regionData={maluku} />
        <RegionStatistics regionName="Papua" regionData={papua} />
      </div>
    </div>
  );
};
