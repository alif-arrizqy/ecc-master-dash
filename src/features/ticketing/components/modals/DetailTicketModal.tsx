/**
 * Detail Ticket Modal
 * Modal untuk menampilkan full detail ticket dengan 6 sections
 */

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit, Plus, X } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import { SLABadge } from "../SLABadge";
import { troubleTicketApi } from "../../services/ticketing.api";
import type { Ticket } from "../../types/ticketing.types";

interface DetailTicketModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket?: Ticket;
    onEdit?: () => void;
    onAddProgress?: () => void;
    onClose?: () => void;
}

export const DetailTicketModal = ({
    open,
    onOpenChange,
    ticket,
    onEdit,
    onAddProgress,
    onClose,
}: DetailTicketModalProps) => {
    // Fetch progress history
    const { data: progressHistory = [] } = useQuery({
        queryKey: ["progress-history", ticket?.ticket_number],
        queryFn: () =>
            ticket?.ticket_number
                ? troubleTicketApi.getProgressHistory(ticket.ticket_number)
                : Promise.resolve([]),
        enabled: open && !!ticket?.ticket_number,
    });

    if (!ticket) return null;

    const isTicketClosed = ticket.status === "closed";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        Detail Ticket #{ticket.ticket_number}
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
                                        Ticket Number
                                    </label>
                                    <p className="mt-1 p-2 bg-muted rounded font-semibold">
                                        {ticket.ticket_number}
                                    </p>
                                </div>
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
                                        {ticket.duration_down || 0} days
                                    </p>
                                </div>
                                {ticket.created_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Created At
                                        </label>
                                        <p className="mt-1">
                                            {format(
                                                new Date(ticket.created_at),
                                                "yyyy-MM-dd HH:mm",
                                            )}
                                        </p>
                                    </div>
                                )}
                                {ticket.updated_at && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Updated At
                                        </label>
                                        <p className="mt-1">
                                            {format(
                                                new Date(ticket.updated_at),
                                                "yyyy-MM-dd HH:mm",
                                            )}
                                        </p>
                                    </div>
                                )}
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
                                    {ticket.plan_cm}
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
                            {progressHistory.length === 0 ? (
                                <p className="text-muted-foreground text-sm">
                                    No progress recorded yet
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {progressHistory
                                        .sort(
                                            (a, b) =>
                                                new Date(b.date).getTime() -
                                                new Date(a.date).getTime(),
                                        )
                                        .map((progress, idx) => (
                                            <div
                                                key={idx}
                                                className="border-l-2 border-primary pl-4 pb-4"
                                            >
                                                <p className="text-sm font-medium text-muted-foreground">
                                                    {format(
                                                        new Date(progress.date),
                                                        "yyyy-MM-dd",
                                                    )}
                                                </p>
                                                <p className="mt-1 text-sm">
                                                    {progress.action}
                                                </p>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    {!isTicketClosed && onEdit && (
                        <Button onClick={onEdit} className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                    {!isTicketClosed && onAddProgress && (
                        <Button
                            onClick={onAddProgress}
                            variant="outline"
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Progress
                        </Button>
                    )}
                    {!isTicketClosed && onClose && (
                        <Button
                            onClick={onClose}
                            variant="destructive"
                            className="gap-2"
                        >
                            <X className="h-4 w-4" />
                            Close Ticket
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
