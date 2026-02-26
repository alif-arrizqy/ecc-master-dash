import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Eye,
    Edit,
    Plus,
    Trash2,
    Lock,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { SLABadge } from "./SLABadge";
import type { Ticket } from "../types/ticketing.types";

interface TicketTableProps {
    data: Ticket[];
    isLoading?: boolean;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onView: (ticket: Ticket) => void;
    onEdit: (ticket: Ticket) => void;
    onAddProgress: (ticket: Ticket) => void;
    onClose: (ticket: Ticket) => void;
    onDelete: (ticket: Ticket) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
}

type SortField = "date_down" | "duration" | "sla_avg";
type SortOrder = "asc" | "desc" | null;

export const TicketTable = ({
    data,
    isLoading,
    pagination,
    onView,
    onEdit,
    onAddProgress,
    onClose,
    onDelete,
    onPageChange,
    onPerPageChange,
}: TicketTableProps) => {
    const [sortField, setSortField] = useState<SortField | null>("duration");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortOrder === "asc") {
                setSortOrder("desc");
            } else if (sortOrder === "desc") {
                setSortOrder(null);
                setSortField(null);
            }
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    const sortedData = useMemo(() => {
        if (!sortField || !sortOrder) return data;

        const sorted = [...data].sort((a, b) => {
            let aVal: number;
            let bVal: number;

            if (sortField === "date_down") {
                aVal = new Date(a.date_down).getTime();
                bVal = new Date(b.date_down).getTime();
            } else if (sortField === "duration") {
                aVal = a.duration_down || 0;
                bVal = b.duration_down || 0;
            } else {
                aVal = a.sla_avg || 0;
                bVal = b.sla_avg || 0;
            }

            return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
        });

        return sorted;
    }, [data, sortField, sortOrder]);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field)
            return <ArrowUpDown className="h-3 w-3 shrink-0" />;
        return sortOrder === "asc" ? (
            <ArrowUp className="h-3 w-3 shrink-0 text-primary" />
        ) : (
            <ArrowDown className="h-3 w-3 shrink-0 text-primary" />
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 bg-muted rounded animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 text-4xl">📋</div>
                <h3 className="font-semibold text-lg mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-6">
                    Belum ada trouble ticket. Buat yang pertama sekarang.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/50">
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                No.
                            </th>
                            <th
                                className="py-3 px-4 text-sm font-medium text-muted-foreground text-center whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("duration")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    Durasi Down
                                    <SortIcon field="duration" />
                                </div>
                            </th>
                            <th
                                className="py-3 px-4 text-sm font-medium text-muted-foreground text-center whitespace-nowrap cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort("sla_avg")}
                            >
                                <div className="flex items-center justify-center gap-1">
                                    SLA Avg
                                    <SortIcon field="sla_avg" />
                                </div>
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                Nama Site
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                Provinsi
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                Baterai
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                Problem
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap">
                                PIC
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap max-w-[180px]">
                                Action
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-left whitespace-nowrap max-w-[150px]">
                                Plan CM
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-center whitespace-nowrap">
                                Status
                            </th>
                            <th className="py-3 px-4 text-sm font-medium text-muted-foreground text-center whitespace-nowrap">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((ticket, index) => {
                            const duration = ticket.duration_down || 0;
                            const isClosed = ticket.status === "closed";

                            return (
                                <tr
                                    key={ticket.ticket_number}
                                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                                >
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                                        {index + 1}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-center align-middle text-muted-foreground">
                                        {duration} hari
                                    </td>
                                    <td className="py-3 px-4 text-sm text-center align-middle">
                                        <SLABadge value={ticket.sla_avg} />
                                    </td>
                                    <td className="py-3 px-4 text-sm text-foreground align-middle">
                                        {ticket.site?.site_name?.toUpperCase() ||
                                            "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                                        {ticket.site?.province || "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                                        {ticket.site?.battery_version?.toUpperCase() ||
                                            "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm align-middle">
                                        {ticket.problems &&
                                        ticket.problems.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {ticket.problems
                                                    .slice(0, 2)
                                                    .map((p) => (
                                                        <span
                                                            key={p.id}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground whitespace-nowrap"
                                                        >
                                                            {p.name}
                                                        </span>
                                                    ))}
                                                {ticket.problems.length > 2 && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                        +
                                                        {ticket.problems
                                                            .length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle">
                                        {ticket.pic?.name || "-"}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle max-w-[180px]">
                                        <p className="line-clamp-2 text-xs">
                                            {ticket.action || "-"}
                                        </p>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground align-middle max-w-[150px]">
                                        <p className="line-clamp-2 text-xs">
                                            {ticket.plan_cm || "-"}
                                        </p>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-center align-middle">
                                        <StatusBadge status={ticket.status} />
                                    </td>
                                    <td className="py-3 px-4 text-center align-middle">
                                        <div className="flex justify-center items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onView(ticket)}
                                                title="View Details"
                                                className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                            >
                                                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(ticket)}
                                                disabled={isClosed}
                                                title={
                                                    isClosed
                                                        ? "Cannot edit closed ticket"
                                                        : "Edit"
                                                }
                                                className="h-8 w-8 p-0 hover:bg-primary/10 disabled:opacity-40"
                                            >
                                                <Edit className="h-4 w-4 text-primary" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onAddProgress(ticket)
                                                }
                                                disabled={isClosed}
                                                title={
                                                    isClosed
                                                        ? "Cannot add progress to closed ticket"
                                                        : "Add Progress"
                                                }
                                                className="h-8 w-8 p-0 hover:bg-status-good/10 disabled:opacity-40"
                                            >
                                                <Plus className="h-4 w-4 text-status-good" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onClose(ticket)}
                                                disabled={isClosed}
                                                title={
                                                    isClosed
                                                        ? "Ticket already closed"
                                                        : "Close Ticket"
                                                }
                                                className={cn(
                                                    "h-8 w-8 p-0 hover:bg-status-danger/10 disabled:opacity-40",
                                                    "text-status-danger",
                                                )}
                                            >
                                                <Lock className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(ticket)}
                                                disabled={isClosed}
                                                title={
                                                    isClosed
                                                        ? "Cannot delete closed ticket"
                                                        : "Delete"
                                                }
                                                className="h-8 w-8 p-0 hover:bg-status-danger/10 disabled:opacity-40"
                                            >
                                                <Trash2 className="h-4 w-4 text-status-danger" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1}–
                        {Math.min(
                            pagination.page * pagination.limit,
                            pagination.total,
                        )}{" "}
                        of {pagination.total} entries
                    </p>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Per Page:
                            </span>
                            <Select
                                value={String(pagination.limit)}
                                onValueChange={(value) =>
                                    onPerPageChange?.(Number(value))
                                }
                            >
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onPageChange?.(pagination.page - 1)
                                }
                                disabled={pagination.page === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium px-1">
                                Page {pagination.page} of{" "}
                                {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    onPageChange?.(pagination.page + 1)
                                }
                                disabled={
                                    pagination.page === pagination.totalPages
                                }
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
