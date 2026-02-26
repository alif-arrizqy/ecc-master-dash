/**
 * Add Progress Modal
 * Modal untuk menambah progress history
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
import type { Ticket, AddProgressFormData, TicketStatus } from '../../types/ticketing.types';

interface AddProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket;
  isSubmitting?: boolean;
  onSubmit: (data: AddProgressFormData) => void;
}

export const AddProgressModal = ({
  open,
  onOpenChange,
  ticket,
  isSubmitting = false,
  onSubmit,
}: AddProgressModalProps) => {
  const [formData, setFormData] = useState<AddProgressFormData>({
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
      newErrors.action = 'Action tidak boleh kosong';
    }
    if (formData.action.length > 500) {
      newErrors.action = 'Action maksimal 500 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if ticket is closed
    if (ticket?.status === 'closed') {
      setErrors({
        submit: 'Cannot add progress to closed ticket',
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
          <DialogTitle>Add Progress to Ticket #{ticket.ticket_number}</DialogTitle>
          <DialogDescription>Tambahkan progress terbaru untuk ticket ini</DialogDescription>
        </DialogHeader>

        {isClosed && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ticket ini sudah ditutup dan tidak bisa ditambahkan progress baru
            </AlertDescription>
          </Alert>
        )}

        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div>
            <Label htmlFor="progress_date">Date</Label>
            <Input
              id="progress_date"
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

          {/* Action */}
          <div>
            <Label htmlFor="progress_action">Action</Label>
            <Textarea
              id="progress_action"
              value={formData.action}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, action: e.target.value }));
                if (errors.action) {
                  setErrors((prev) => ({ ...prev, action: '' }));
                }
              }}
              placeholder="Deskripsi action/pekerjaan yang dilakukan..."
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
            <Button type="submit" disabled={isSubmitting || isClosed}>
              {isSubmitting ? 'Adding...' : 'Add Progress'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
