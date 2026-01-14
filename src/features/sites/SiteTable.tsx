/**
 * Site Table Component
 */

import { Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Site } from '../types';
import { formatSccType, formatSiteName, formatDate } from '../utils';
import { STATUS_OPTIONS, BATTERY_VERSIONS } from '../constants';

interface SiteTableProps {
  sites: Site[];
  onView: (site: Site) => void;
  onEdit: (site: Site) => void;
  onDelete: (site: Site) => void;
}

export const SiteTable = ({ sites, onView, onEdit, onDelete }: SiteTableProps) => {
  if (sites.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
          Tidak ada data
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {sites.map((site) => (
        <TableRow key={site.siteId}>
          <TableCell className="font-medium">{site.siteId}</TableCell>
          <TableCell>{formatSiteName(site.siteName)}</TableCell>
          <TableCell>{site.detail?.province || '-'}</TableCell>
          <TableCell>{site.ipSnmp || '-'}</TableCell>
          <TableCell>
            {site.sccType ? (
              <Badge variant="outline">{formatSccType(site.sccType)}</Badge>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            {site.batteryVersion ? (
              <Badge variant="outline">
                {BATTERY_VERSIONS.find((bv) => bv.value === site.batteryVersion)?.label ||
                  site.batteryVersion}
              </Badge>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>{site.totalBattery ?? '-'}</TableCell>
          <TableCell>{formatDate(site.detail?.talisInstalled)}</TableCell>
          <TableCell>
            {site.statusSites ? (
              <Badge variant={site.statusSites === 'terestrial' ? 'default' : 'secondary'}>
                {STATUS_OPTIONS.find((s) => s.value === site.statusSites)?.label ||
                  site.statusSites}
              </Badge>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            {site.webappUrl ? (
              <a
                href={`http://${site.webappUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                {site.webappUrl.length > 30
                  ? `${site.webappUrl.substring(0, 30)}...`
                  : site.webappUrl}
              </a>
            ) : (
              '-'
            )}
          </TableCell>
          <TableCell>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onView(site)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(site)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(site)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

