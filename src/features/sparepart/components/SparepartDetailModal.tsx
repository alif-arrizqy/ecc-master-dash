import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, FileText, User, Phone, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { Sparepart } from '../types/sparepart.types';
import { PhotoGalleryModal } from './PhotoGalleryModal';
import { useState } from 'react';

interface SparepartDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Sparepart | null;
}

export const SparepartDetailModal = ({
  open,
  onOpenChange,
  data,
}: SparepartDetailModalProps) => {
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
  const [photoGalleryType, setPhotoGalleryType] = useState<'stok' | 'bekas'>('stok');

  if (!data) return null;

  const getRegionLabel = (region: string) => {
    return region === 'maluku' ? 'Maluku' : region === 'papua' ? 'Papua' : region;
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      stok: 'Sparepart Stok',
      bekas: 'Sparepart Bekas',
      tools_alker: 'Tools Alker',
    };
    return typeMap[type] || type;
  };

  const handleViewPhotos = (type: 'stok' | 'bekas') => {
    setPhotoGalleryType(type);
    setPhotoGalleryOpen(true);
  };

  const photos = photoGalleryType === 'stok' 
    ? (data.dokumentasiStok || [])
    : (data.dokumentasiBekas || []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange} key={data?.id || 'modal'}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    Detail Sparepart
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Informasi lengkap data sparepart
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="px-3 py-1.5">
                {getRegionLabel(data.region)} - {getTypeLabel(data.type)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <MapPin className="h-4 w-4" />
                Informasi Lokasi
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Kabupaten</Label>
                  <p className="text-sm font-medium">{data.kabupaten || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cluster</Label>
                  <p className="text-sm font-medium">{data.cluster || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Region</Label>
                  <p className="text-sm font-medium">{getRegionLabel(data.region)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipe</Label>
                  <p className="text-sm font-medium">{getTypeLabel(data.type)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sparepart Stok */}
            {data.sparepartStok && data.sparepartStok.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Package className="h-4 w-4" />
                      Sparepart Stok
                    </div>
                    {data.dokumentasiStok && data.dokumentasiStok.length > 0 && (
                      <button
                        onClick={() => handleViewPhotos('stok')}
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Lihat Foto ({data.dokumentasiStok.length})
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {data.sparepartStok.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="outline" className="font-semibold">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Sparepart Bekas */}
            {data.sparepartBekas && data.sparepartBekas.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Package className="h-4 w-4" />
                      Sparepart Bekas
                    </div>
                    {data.dokumentasiBekas && data.dokumentasiBekas.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotos('bekas')}
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Lihat Foto ({data.dokumentasiBekas.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {data.sparepartBekas.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="outline" className="font-semibold">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Tools Alker (jika type tools_alker) */}
            {data.type === 'tools_alker' && data.sparepartStok && data.sparepartStok.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Package className="h-4 w-4" />
                      Tools Alker
                    </div>
                    {data.dokumentasiStok && data.dokumentasiStok.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPhotos('stok')}
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Lihat Foto ({data.dokumentasiStok.length})
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {data.sparepartStok.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-lg border bg-muted/50 flex items-center justify-between hover:bg-muted/70 transition-colors"
                      >
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="outline" className="font-semibold">
                          {item.quantity} {item.unit}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Catatan */}
            {data.catatan && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <FileText className="h-4 w-4" />
                    Catatan
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.catatan}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* PIC & Kontak */}
            {(data.pic || data.kontak) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <User className="h-4 w-4" />
                  Kontak
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {data.pic && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <User className="h-3 w-3" />
                        PIC
                      </Label>
                      <p className="text-sm font-medium">{data.pic}</p>
                    </div>
                  )}
                  {data.kontak && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        Kontak
                      </Label>
                      <p className="text-sm font-medium">{data.kontak}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modal */}
      <PhotoGalleryModal
        photos={photos}
        open={photoGalleryOpen}
        onOpenChange={setPhotoGalleryOpen}
        title={`Dokumentasi ${photoGalleryType === 'stok' ? 'Stok' : 'Bekas'}`}
      />
    </>
  );
};
