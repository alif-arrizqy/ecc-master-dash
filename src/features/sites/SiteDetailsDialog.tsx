/**
 * Site Details Dialog Component
 * Displays detailed information about a site
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Site } from '@/features/sites/types';

interface SiteDetailsDialogProps {
  site: Site | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SiteDetailsDialog = ({ site, open, onOpenChange }: SiteDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Site Details</DialogTitle>
          <DialogDescription>Detail lengkap untuk site {site?.siteId}</DialogDescription>
        </DialogHeader>
        {site && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informasi Dasar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Site ID</Label>
                  <p className="text-sm font-medium mt-1">{site.siteId || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Site Name</Label>
                  <p className="text-sm font-medium mt-1">{site.siteName || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">PR Code</Label>
                  <p className="text-sm font-medium mt-1">{site.prCode || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cluster ID</Label>
                  <p className="text-sm font-medium mt-1">{site.clusterId || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Terminal ID</Label>
                  <p className="text-sm font-medium mt-1">{site.terminalId || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status Sites</Label>
                  <p className="text-sm font-medium mt-1 capitalize">
                    {site.statusSites?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Is Active</Label>
                  <p className="text-sm font-medium mt-1">
                    {site.isActive !== undefined
                      ? site.isActive
                        ? 'Active'
                        : 'Inactive'
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Network Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informasi Jaringan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">IP SNMP</Label>
                  <p className="text-sm font-medium mt-1 font-mono">{site.ipSnmp || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IP Site</Label>
                  <p className="text-sm font-medium mt-1 font-mono">{site.ipSite || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">IP Mini PC</Label>
                  <p className="text-sm font-medium mt-1 font-mono">{site.ipMiniPc || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Webapp URL</Label>
                  <p className="text-sm font-medium mt-1 break-all">
                    {site.webappUrl ? (
                      <a
                        href={`http://${site.webappUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {site.webappUrl}
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Informasi Hardware</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">SCC Type</Label>
                  <p className="text-sm font-medium mt-1 uppercase">
                    {site.sccType?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Battery Version</Label>
                  <p className="text-sm font-medium mt-1 capitalize">
                    {site.batteryVersion || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Battery</Label>
                  <p className="text-sm font-medium mt-1">{site.totalBattery ?? '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">EHub Version</Label>
                  <p className="text-sm font-medium mt-1 capitalize">
                    {site.ehubVersion || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Panel 2 Type</Label>
                  <p className="text-sm font-medium mt-1 capitalize">
                    {site.panel2Type || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            {site.detail && (
              <div>
                <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Detail Lokasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Province</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.province || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Regency</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.regency || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Subdistrict</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.subdistrict || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Village</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.village || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Latitude</Label>
                    <p className="text-sm font-medium mt-1 font-mono">
                      {site.detail.latitude || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Longitude</Label>
                    <p className="text-sm font-medium mt-1 font-mono">
                      {site.detail.longitude || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Talis Installed</Label>
                    <p className="text-sm font-medium mt-1">
                      {site.detail.talisInstalled || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Build Year</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.buildYear || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Project Phase</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.projectPhase || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">On Air Date</Label>
                    <p className="text-sm font-medium mt-1">{site.detail.onairDate || '-'}</p>
                  </div>
                </div>

                {/* Network Details */}
                {(site.detail.ipGatewayGs ||
                  site.detail.ipGatewayLc ||
                  site.detail.subnet) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">Network Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">IP Gateway GS</Label>
                        <p className="text-sm font-medium mt-1 font-mono">
                          {site.detail.ipGatewayGs || '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">IP Gateway LC</Label>
                        <p className="text-sm font-medium mt-1 font-mono">
                          {site.detail.ipGatewayLc || '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Subnet</Label>
                        <p className="text-sm font-medium mt-1 font-mono">
                          {site.detail.subnet || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Battery & Cabinet Lists */}
                {/* {(site.detail.batteryList?.length || site.detail.cabinetList?.length) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">Lists</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {site.detail.batteryList && site.detail.batteryList.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Battery List ({site.detail.batteryList.length})
                          </Label>
                          <div className="mt-2 space-y-1">
                            {site.detail.batteryList.map((battery, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 rounded bg-muted/30 border border-border/30"
                              >
                                {String(battery)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {site.detail.cabinetList && site.detail.cabinetList.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Cabinet List ({site.detail.cabinetList.length})
                          </Label>
                          <div className="mt-2 space-y-1">
                            {site.detail.cabinetList.map((cabinet, idx) => (
                              <div
                                key={idx}
                                className="text-sm p-2 rounded bg-muted/30 border border-border/30"
                              >
                                {String(cabinet)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                {/* Contact Person */}
                {site.detail.contactPerson && site.detail.contactPerson.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-3">
                      Contact Person ({site.detail.contactPerson.length})
                    </h4>
                    <div className="space-y-2">
                      {site.detail.contactPerson.map((contact, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded bg-muted/30 border border-border/30"
                        >
                          <p className="text-sm font-medium">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

