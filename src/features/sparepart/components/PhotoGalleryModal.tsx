import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { cn } from '@/shared/lib/utils';
import type { SparepartPhoto } from '../types/sparepart.types';

interface PhotoGalleryModalProps {
  photos: SparepartPhoto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export const PhotoGalleryModal = ({
  photos,
  open,
  onOpenChange,
  title = 'Dokumentasi Foto',
}: PhotoGalleryModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  if (photos.length === 0) {
    return null;
  }

  const currentPhoto = photos[selectedIndex];
  const hasNext = selectedIndex < photos.length - 1;
  const hasPrev = selectedIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setSelectedIndex(selectedIndex + 1);
      setIsZoomed(false);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setSelectedIndex(selectedIndex - 1);
      setIsZoomed(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && hasPrev) {
      handlePrev();
    } else if (e.key === 'ArrowRight' && hasNext) {
      handleNext();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[95vh] p-0 overflow-y-auto flex flex-col [&>button:last-child]:hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Foto {selectedIndex + 1} dari {photos.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsZoomed(!isZoomed)}
              title={isZoomed ? 'Zoom Out' : 'Zoom In'}
            >
              {isZoomed ? (
                <ZoomOut className="h-4 w-4" />
              ) : (
                <ZoomIn className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Photo Display */}
        <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10 p-6 min-h-[400px] max-h-[60vh] overflow-auto">
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || `Foto ${selectedIndex + 1}`}
            className={cn(
              'max-w-full max-h-[70vh] object-contain transition-all duration-300 rounded-lg shadow-lg',
              isZoomed && 'scale-150 cursor-zoom-out',
              !isZoomed && 'cursor-zoom-in hover:shadow-xl'
            )}
            onClick={() => setIsZoomed(!isZoomed)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="flex flex-col items-center justify-center p-12 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30">
                    <svg class="h-16 w-16 text-muted-foreground/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p class="text-sm text-muted-foreground text-center font-medium">Gambar tidak dapat dimuat</p>
                    <p class="text-xs text-muted-foreground/70 text-center mt-2 break-all px-4">URL: ${currentPhoto.url || 'N/A'}</p>
                  </div>
                `;
              }
            }}
            loading="lazy"
          />

          {/* Navigation Arrows */}
          {hasPrev && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {hasNext && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Thumbnail Strip */}
        {photos.length > 1 && (
          <div className="px-6 py-4 border-t bg-card">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setSelectedIndex(index);
                    setIsZoomed(false);
                  }}
                  className={cn(
                    'flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                    selectedIndex === index
                      ? 'border-primary ring-2 ring-primary/30 shadow-md'
                      : 'border-border hover:border-primary/50 opacity-70 hover:opacity-100'
                  )}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.caption || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </button>
              ))}
            </div>
            {currentPhoto.caption && (
              <p className="text-sm text-muted-foreground mt-3 text-center font-medium">
                {currentPhoto.caption}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
