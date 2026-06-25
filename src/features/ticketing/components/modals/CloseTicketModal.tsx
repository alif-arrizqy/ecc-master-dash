/**
 * Close Ticket Modal
 * Modal untuk confirm dan close ticket
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import type { Ticket, CloseTicketFormData } from '../../types/ticketing.types';

interface CloseTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket;
  isSubmitting?: boolean;
  onSubmit: (data: CloseTicketFormData) => void;
}

export const CloseTicketModal = ({
  open,
  onOpenChange,
  ticket,
  isSubmitting = false,
  onSubmit,
}: CloseTicketModalProps) => {
  const [formData, setFormData] = useState<CloseTicketFormData>({
    date: new Date().toISOString().split('T')[0],
    action: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        action: '',
      });
      setErrors({});
    }
  }, [open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Tanggal tidak boleh kosong';
    }
    if (!formData.action.trim()) {
      newErrors.action = 'Closing action tidak boleh kosong';
    }
    if (formData.action.length > 500) {
      newErrors.action = 'Closing action maksimal 500 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if ticket is already closed
    if (ticket?.status === 'closed') {
      setErrors({
        submit: 'Ticket is already closed',
      });
      return;
    }

    if (validate()) {
      onSubmit(formData);
    }
  };

  if (!ticket) return null;

  const isClosed = ticket.status === 'closed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close Ticket #{ticket.ticket_number}</DialogTitle>
          <DialogDescription>
            Apakah anda yakin ingin menutup ticket ini? Ticket yang sudah ditutup tidak dapat diubah atau ditambahkan progress baru.
          </DialogDescription>
        </DialogHeader>

        {isClosed && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Ticket ini sudah ditutup</AlertDescription>
          </Alert>
        )}

        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Current Status */}
        <div className="p-3 bg-muted rounded">
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            Current Status
          </label>
          <StatusBadge status={ticket.status} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Closed */}
          <div>
            <Label htmlFor="close_date">Date Closed</Label>
            <Input
              id="close_date"
              type="date"
              value={formData.date}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, date: e.target.value }));
                if (errors.date) {
                  setErrors((prev) => ({ ...prev, date: '' }));
                }
              }}
              disabled={isClosed}
            />
            {errors.date && (
              <Alert variant="destructive" className="mt-1">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{errors.date}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Closing Action */}
          <div>
            <Label htmlFor="closing_action">Closing Action</Label>
            <Textarea
              id="closing_action"
              value={formData.action}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, action: e.target.value }));
                if (errors.action) {
                  setErrors((prev) => ({ ...prev, action: '' }));
                }
              }}
              placeholder="Final action / hasil perbaikan..."
              maxLength={500}
              rows={4}
              disabled={isClosed}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {formData.action.length}/500
            </div>
            {errors.action && (
              <Alert variant="destructive" className="mt-1">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">{errors.action}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isClosed}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting || isClosed}
            >
              {isSubmitting ? 'Closing...' : 'Confirm Close'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
