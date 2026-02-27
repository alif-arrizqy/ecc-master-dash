/**
 * Detail Ticket Modal
 * Modal untuk menampilkan full detail ticket
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit, Plus, X, Pencil, Trash2, Check, AlertTriangle, Lock } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { SLABadge } from "../SLABadge";
import { troubleTicketApi } from "../../services/ticketing.api";
import type { Ticket, ProgressHistory } from "../../types/ticketing.types";

interface DetailTicketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket?: Ticket;
    onEdit?: () => void;
    onAddProgress?: () => void;
    onClose?: () => void;
}

interface EditingProgress {
    id: number;
    date: string;
    action: string;
}

export const DetailTicketModal = ({
    open,
    onOpenChange,
    ticket,
    onEdit,
    onAddProgress,
    onClose,
}: DetailTicketModalProps) => {
    const queryClient = useQueryClient();
    const [editingProgress, setEditingProgress] = useState<EditingProgress | null>(null);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [isDeletingProgress, setIsDeletingProgress] = useState(false);

    // Fetch progress history
    const { data: progressHistory = [], refetch: refetchProgress } = useQuery({
        queryKey: ["progress-history", ticket?.ticket_number],
        queryFn: () =>
            ticket?.ticket_number
                ? troubleTicketApi.getProgressHistory(ticket.ticket_number)
                : Promise.resolve([]),
        enabled: open && !!ticket?.ticket_number,
    });

    if (!ticket) return null;

    const isTicketClosed = ticket.status === "closed";

    // Group progress by date (sorted ascending)
    const sortedProgress = [...progressHistory].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const groupedProgress = sortedProgress.reduce<Record<string, ProgressHistory[]>>(
        (acc, p) => {
            const key = p.date;
            if (!acc[key]) acc[key] = [];
            acc[key].push(p);
            return acc;
        },
        {},
    );
    const progressDates = Object.keys(groupedProgress).sort();

    const handleStartEdit = (progress: ProgressHistory) => {
        setConfirmDeleteId(null);
        setEditingProgress({
            id: progress.id,
            date: progress.date,
            action: progress.action,
        });
    };

    const handleCancelEdit = () => {
        setEditingProgress(null);
    };

    const handleSaveEdit = async () => {
        if (!editingProgress || !ticket) return;
        setIsSavingProgress(true);
        try {
            await troubleTicketApi.updateProgress(
                ticket.ticket_number,
                editingProgress.id,
                { date: editingProgress.date, action: editingProgress.action },
            );
            toast.success("Progress berhasil diupdate");
            setEditingProgress(null);
            refetchProgress();
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        } catch {
            toast.error("Gagal mengupdate progress");
        } finally {
            setIsSavingProgress(false);
        }
    };

    const handleConfirmDelete = async (progressId: number) => {
        if (!ticket) return;
        setIsDeletingProgress(true);
        try {
            await troubleTicketApi.deleteProgress(ticket.ticket_number, progressId);
            toast.success("Progress berhasil dihapus");
            setConfirmDeleteId(null);
            refetchProgress();
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        } catch {
            toast.error("Gagal menghapus progress");
        } finally {
            setIsDeletingProgress(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Detail Ticket
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* I. INFORMASI TICKET */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Informasi Ticket
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Ticket Type
                                    </label>
                                    <p className="mt-1">
                                        {ticket.ticket_type?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <div className="mt-1">
                                        <StatusBadge status={ticket.status} />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Date Down
                                    </label>
                                    <p className="mt-1">
                                        {format(
                                            new Date(ticket.date_down),
                                            "yyyy-MM-dd",
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Duration Down
                                    </label>
                                    <p className="mt-1">
                                        {ticket.duration_down || 0} hari
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* II. INFORMASI SITE */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Informasi Site
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Site ID
                                    </label>
                                    <p className="mt-1">{ticket.site_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        PR Code
                                    </label>
                                    <p className="mt-1">
                                        {ticket.site?.pr_code || "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Nama Site
                                    </label>
                                    <p className="mt-1">
                                        {ticket.site?.site_name?.toUpperCase() ||
                                            "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Provinsi
                                    </label>
                                    <p className="mt-1">
                                        {ticket.site?.province?.toUpperCase() ||
                                            "-"}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Baterai Versi
                                    </label>
                                    <p className="mt-1">
                                        {ticket.site?.battery_version?.toUpperCase() ||
                                            "-"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* III. SLA INFORMATION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                SLA Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        SLA Avg
                                    </label>
                                    <div className="mt-1">
                                        <SLABadge value={ticket.sla_avg} />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* IV. CONTACT INFORMATION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    PIC Name
                                </label>
                                <p className="mt-1">
                                    {ticket.pic?.name || "-"}
                                </p>
                            </div>
                            {ticket.contact_persons &&
                            ticket.contact_persons.length > 0 ? (
                                <div className="border-t pt-4">
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        Contact Persons
                                    </label>
                                    <div className="space-y-3">
                                        {ticket.contact_persons.map(
                                            (contact, idx) => (
                                                <div
                                                    key={idx}
                                                    className="p-3 border rounded"
                                                >
                                                    <p className="font-medium">
                                                        {contact.name}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {contact.phone || "-"}
                                                    </p>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* V. RENCANA DAN ACTION */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Rencana dan Action
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Plan CM
                                </label>
                                <p className="mt-1 whitespace-pre-wrap">
                                    {ticket.plan_cm || "-"}
                                </p>
                            </div>
                            {ticket.problems && ticket.problems.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                        Problems
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ticket.problems.map((problem) => (
                                            <Badge
                                                key={problem.id}
                                                variant="outline"
                                            >
                                                {problem.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Action
                                </label>
                                <div className="mt-1 p-3 bg-muted rounded whitespace-pre-wrap text-sm">
                                    {ticket.action}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* VI. HISTORY PROGRESS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                History Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {progressDates.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    Belum ada progress
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    {progressDates.map((date) => (
                                        <div key={date}>
                                            {/* Date header */}
                                            <p className="text-sm font-semibold text-muted-foreground mb-2 border-b pb-1">
                                                {format(new Date(date), "yyyy-MM-dd")}
                                            </p>
                                            {/* Entries for this date */}
                                            <div className="space-y-2 pl-2">
                                                {groupedProgress[date].map((progress) => (
                                                    <div key={progress.id}>
                                                        {editingProgress?.id === progress.id ? (
                                                            /* Inline Edit Form */
                                                            <div className="border border-blue-200 rounded-lg p-3 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 space-y-2">
                                                                <div>
                                                                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-400">Tanggal</Label>
                                                                    <Input
                                                                        type="date"
                                                                        value={editingProgress.date}
                                                                        onChange={(e) =>
                                                                            setEditingProgress((prev) =>
                                                                                prev ? { ...prev, date: e.target.value } : null,
                                                                            )
                                                                        }
                                                                        className="mt-1 h-8 text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs font-medium text-blue-700 dark:text-blue-400">Progress</Label>
                                                                    <Textarea
                                                                        value={editingProgress.action}
                                                                        onChange={(e) =>
                                                                            setEditingProgress((prev) =>
                                                                                prev ? { ...prev, action: e.target.value } : null,
                                                                            )
                                                                        }
                                                                        rows={3}
                                                                        className="mt-1 text-sm"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={handleCancelEdit}
                                                                        disabled={isSavingProgress}
                                                                        className="h-7 text-xs border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                                                                    >
                                                                        Batal
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={handleSaveEdit}
                                                                        disabled={isSavingProgress}
                                                                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                                                                    >
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        {isSavingProgress ? "Menyimpan..." : "Simpan"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : confirmDeleteId === progress.id ? (
                                                            /* Inline Delete Confirmation */
                                                            <div className="border border-red-200 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900 space-y-2">
                                                                <div className="flex items-start gap-2">
                                                                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-red-700 dark:text-red-400">Hapus progress ini?</p>
                                                                        <p className="text-xs text-red-600/80 dark:text-red-500/80 mt-0.5 line-clamp-2">{progress.action}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 justify-end">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setConfirmDeleteId(null)}
                                                                        disabled={isDeletingProgress}
                                                                        className="h-7 text-xs border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                                                                    >
                                                                        Batal
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleConfirmDelete(progress.id)}
                                                                        disabled={isDeletingProgress}
                                                                        className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                                                                    >
                                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                                        {isDeletingProgress ? "Menghapus..." : "Hapus"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* Progress Item */
                                                            <div className="flex items-start gap-2 group py-1 px-2 rounded hover:bg-muted/50 transition-colors">
                                                                <span className="text-muted-foreground text-sm mt-0.5 shrink-0">•</span>
                                                                <p className="text-sm flex-1">{progress.action}</p>
                                                                {!isTicketClosed && (
                                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                                                            title="Edit progress"
                                                                            onClick={() => handleStartEdit(progress)}
                                                                        >
                                                                            <Pencil className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                            title="Hapus progress"
                                                                            onClick={() => setConfirmDeleteId(progress.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
                    {/* Close modal */}
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 transition-all duration-200"
                    >
                        <X className="h-4 w-4 mr-1.5" />
                        Tutup
                    </Button>

                    {/* Edit ticket */}
                    {!isTicketClosed && onEdit && (
                        <Button
                            onClick={onEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit Ticket
                        </Button>
                    )}

                    {/* Add Progress */}
                    {!isTicketClosed && onAddProgress && (
                        <Button
                            onClick={onAddProgress}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Add Progress
                        </Button>
                    )}

                    {/* Close Ticket */}
                    {!isTicketClosed && onClose && (
                        <Button
                            onClick={onClose}
                            className="bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Lock className="h-4 w-4 mr-1.5" />
                            Close Ticket
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
