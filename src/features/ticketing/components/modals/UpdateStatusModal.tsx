import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import type {
    ManualStatusUpdateFormData,
    Ticket,
    TicketStatus,
} from "../../types/ticketing.types";

interface UpdateStatusModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket?: Ticket;
    isSubmitting?: boolean;
    onSubmit: (data: ManualStatusUpdateFormData) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ["progress", "pending", "closed"];

export const UpdateStatusModal = ({
    open,
    onOpenChange,
    ticket,
    isSubmitting = false,
    onSubmit,
}: UpdateStatusModalProps) => {
    const [formData, setFormData] = useState<ManualStatusUpdateFormData>({
        status: "progress",
        date: new Date().toISOString().split("T")[0],
        action: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && ticket) {
            setFormData({
                status: ticket.status,
                date: new Date().toISOString().split("T")[0],
                action: "",
            });
            setErrors({});
        }
    }, [open, ticket]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.status) {
            newErrors.status = "Pilih status baru";
        }
        if (ticket && formData.status === ticket.status) {
            newErrors.status = "Status baru harus berbeda dari status saat ini";
        }
        if (!formData.date) {
            newErrors.date = "Tanggal tidak boleh kosong";
        }
        if (!formData.action.trim()) {
            newErrors.action = "Alasan perubahan status wajib diisi";
        }
        if (formData.action.length > 500) {
            newErrors.action = "Alasan perubahan maksimal 500 karakter";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    if (!ticket) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Ubah Status Ticket #{ticket.ticket_number}</DialogTitle>
                    <DialogDescription>
                        Koreksi status ticket secara manual untuk kebutuhan human error handling.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-3 bg-muted rounded">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                        Status Saat Ini
                    </label>
                    <StatusBadge status={ticket.status} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Status Baru</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    status: value as TicketStatus,
                                }));
                                if (errors.status) {
                                    setErrors((prev) => ({ ...prev, status: "" }));
                                }
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih status baru..." />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status === "progress"
                                            ? "In Progress"
                                            : status === "pending"
                                              ? "Pending"
                                              : "Closed"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.status && (
                            <Alert variant="destructive" className="mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <AlertDescription className="text-xs">
                                    {errors.status}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="status_date">Tanggal Perubahan</Label>
                        <Input
                            id="status_date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, date: e.target.value }));
                                if (errors.date) {
                                    setErrors((prev) => ({ ...prev, date: "" }));
                                }
                            }}
                        />
                        {errors.date && (
                            <Alert variant="destructive" className="mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <AlertDescription className="text-xs">
                                    {errors.date}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="status_action">Alasan / Catatan Perubahan</Label>
                        <Textarea
                            id="status_action"
                            value={formData.action}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, action: e.target.value }));
                                if (errors.action) {
                                    setErrors((prev) => ({ ...prev, action: "" }));
                                }
                            }}
                            placeholder="Contoh: Koreksi status karena human error pada input sebelumnya"
                            rows={4}
                            maxLength={500}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            {formData.action.length}/500
                        </div>
                        {errors.action && (
                            <Alert variant="destructive" className="mt-1">
                                <AlertCircle className="h-3 w-3" />
                                <AlertDescription className="text-xs">
                                    {errors.action}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan Status"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
