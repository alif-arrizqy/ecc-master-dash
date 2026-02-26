/**
 * Ticketing Page
 * Halaman utama untuk Trouble Ticketing System
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Ticket as TicketIcon, FileDown } from "lucide-react";
import { useTickets } from "../hooks/useTickets";
import { useTicketTypes } from "../hooks/useTicketTypes";
import { useProblems } from "../hooks/useProblems";
import { usePics } from "../hooks/usePics";
import { TicketFilters } from "../components/TicketFilters";
import { TicketTable } from "../components/TicketTable";
import { DetailTicketModal } from "../components/modals/DetailTicketModal";
import { EditTicketModal } from "../components/modals/EditTicketModal";
import { AddProgressModal } from "../components/modals/AddProgressModal";
import { CloseTicketModal } from "../components/modals/CloseTicketModal";
import { CreateTicketModal } from "../components/modals/CreateTicketModal";
import { troubleTicketApi } from "../services/ticketing.api";
import type {
    Ticket,
    TicketFilterParams,
    CreateTicketFormData,
    EditTicketFormData,
    AddProgressFormData,
    CloseTicketFormData,
} from "../types/ticketing.types";

const TicketingPage = () => {
    const queryClient = useQueryClient();

    // State for pagination and filters
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [filters, setFilters] = useState<Partial<TicketFilterParams>>({});
    const [isExporting, setIsExporting] = useState(false);

    // State for modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [addProgressModalOpen, setAddProgressModalOpen] = useState(false);
    const [closeTicketModalOpen, setCloseTicketModalOpen] = useState(false);

    // State for selected ticket
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    // Fetch data
    const {
        data: ticketsData,
        isLoading: isLoadingTickets,
        isRefetching,
        refetch,
    } = useTickets({
        page,
        perPage,
        ...filters,
    });
    const { data: ticketTypesData = [] } = useTicketTypes();
    const { data: problemsData = [] } = useProblems();
    const { data: picsData = [] } = usePics();

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateTicketFormData) =>
            troubleTicketApi.create(data),
        onSuccess: () => {
            toast.success("Ticket berhasil dibuat");
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            setCreateModalOpen(false);
            setPage(1);
        },
        onError: (error) => {
            toast.error("Gagal membuat ticket", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({
            ticketNumber,
            data,
        }: {
            ticketNumber: string;
            data: EditTicketFormData;
        }) => troubleTicketApi.update(ticketNumber, data),
        onSuccess: () => {
            toast.success("Ticket berhasil diupdate");
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail"] });
            setEditModalOpen(false);
            setSelectedTicket(null);
        },
        onError: (error) => {
            toast.error("Gagal mengupdate ticket", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    const closeTicketMutation = useMutation({
        mutationFn: ({
            ticketNumber,
            data,
        }: {
            ticketNumber: string;
            data: CloseTicketFormData;
        }) => troubleTicketApi.closeTicket(ticketNumber, data),
        onSuccess: () => {
            toast.success("Ticket berhasil ditutup");
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail"] });
            setCloseTicketModalOpen(false);
            setSelectedTicket(null);
        },
        onError: (error) => {
            toast.error("Gagal menutup ticket", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    const addProgressMutation = useMutation({
        mutationFn: ({
            ticketNumber,
            data,
        }: {
            ticketNumber: string;
            data: AddProgressFormData;
        }) => troubleTicketApi.addProgress(ticketNumber, data),
        onSuccess: () => {
            toast.success("Progress berhasil ditambahkan");
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-detail"] });
            queryClient.invalidateQueries({ queryKey: ["progress-history"] });
            setAddProgressModalOpen(false);
            setSelectedTicket(null);
        },
        onError: (error) => {
            toast.error("Gagal menambah progress", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (ticketNumber: string) =>
            troubleTicketApi.delete(ticketNumber),
        onSuccess: () => {
            toast.success("Ticket berhasil dihapus");
            queryClient.invalidateQueries({ queryKey: ["tickets"] });
        },
        onError: (error) => {
            toast.error("Gagal menghapus ticket", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    // Handlers
    const handleViewDetail = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDetailModalOpen(true);
    };

    const handleEdit = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDetailModalOpen(false);
        setEditModalOpen(true);
    };

    const handleAddProgress = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDetailModalOpen(false);
        setAddProgressModalOpen(true);
    };

    const handleCloseTicket = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDetailModalOpen(false);
        setCloseTicketModalOpen(true);
    };

    const handleDelete = (ticket: Ticket) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus ticket ini?")) {
            deleteMutation.mutate(ticket.ticket_number);
        }
    };

    const handleCreateSubmit = (data: CreateTicketFormData) => {
        createMutation.mutate(data);
    };

    const handleEditSubmit = (data: EditTicketFormData) => {
        if (selectedTicket) {
            editMutation.mutate({
                ticketNumber: selectedTicket.ticket_number,
                data,
            });
        }
    };

    const handleAddProgressSubmit = (data: AddProgressFormData) => {
        if (selectedTicket) {
            addProgressMutation.mutate({
                ticketNumber: selectedTicket.ticket_number,
                data,
            });
        }
    };

    const handleCloseSubmit = (data: CloseTicketFormData) => {
        if (selectedTicket) {
            closeTicketMutation.mutate({
                ticketNumber: selectedTicket.ticket_number,
                data,
            });
        }
    };

    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const blob = await troubleTicketApi.exportExcel({
                status: filters.status ? String(filters.status) : undefined,
                ticketType: filters.ticketType ? Number(filters.ticketType) : undefined,
                siteId: filters.siteId || undefined,
                siteName: filters.siteName || undefined,
                province: filters.province || undefined,
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "trouble-ticket-report.xlsx";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success("File Excel berhasil diunduh");
        } catch {
            toast.error("Gagal mengekspor ke Excel");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                            <TicketIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Trouble Ticketing System
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Kelola trouble tickets site Sundaya
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="gap-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-600 hover:text-white hover:border-green-600 dark:hover:bg-green-600 dark:hover:text-white transition-all duration-200"
                        >
                            <FileDown
                                className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`}
                            />
                            {isExporting ? "Exporting..." : "Export Excel"}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            className="gap-2 border-primary/50 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-200"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
                            />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            size="sm"
                            className="gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <Plus className="h-4 w-4" />
                            Add Ticket
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <section className="mb-6 animate-slide-up">
                <TicketFilters
                    ticketTypes={ticketTypesData}
                    onFilterChange={(newFilters) => {
                        setFilters((prev) => ({ ...prev, ...newFilters }));
                        setPage(1);
                    }}
                    onApply={() => {
                        // Filters are already applied on change
                    }}
                />
            </section>

            {/* Table Section */}
            <section className="mb-6 animate-slide-up">
                <div className="bg-card rounded-lg p-6 card-shadow">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                        Tickets List
                    </h3>
                    <TicketTable
                        data={ticketsData?.data || []}
                        isLoading={isLoadingTickets}
                        pagination={ticketsData?.pagination}
                        onView={handleViewDetail}
                        onEdit={handleEdit}
                        onAddProgress={handleAddProgress}
                        onClose={handleCloseTicket}
                        onDelete={handleDelete}
                        onPageChange={setPage}
                        onPerPageChange={setPerPage}
                    />
                </div>
            </section>

            {/* Create Ticket Modal */}
            <CreateTicketModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                ticketTypes={ticketTypesData}
                problems={problemsData}
                pics={picsData}
                isSubmitting={createMutation.isPending}
                onSubmit={handleCreateSubmit}
            />

            {/* Detail Ticket Modal */}
            <DetailTicketModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                ticket={selectedTicket || undefined}
                onEdit={() => handleEdit(selectedTicket!)}
                onAddProgress={() => handleAddProgress(selectedTicket!)}
                onClose={() => handleCloseTicket(selectedTicket!)}
            />

            {/* Edit Ticket Modal */}
            <EditTicketModal
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                ticket={selectedTicket || undefined}
                ticketTypes={ticketTypesData}
                problems={problemsData}
                pics={picsData}
                isSubmitting={editMutation.isPending}
                onSubmit={handleEditSubmit}
            />

            {/* Add Progress Modal */}
            <AddProgressModal
                open={addProgressModalOpen}
                onOpenChange={setAddProgressModalOpen}
                ticket={selectedTicket || undefined}
                isSubmitting={addProgressMutation.isPending}
                onSubmit={handleAddProgressSubmit}
            />

            {/* Close Ticket Modal */}
            <CloseTicketModal
                open={closeTicketModalOpen}
                onOpenChange={setCloseTicketModalOpen}
                ticket={selectedTicket || undefined}
                isSubmitting={closeTicketMutation.isPending}
                onSubmit={handleCloseSubmit}
            />
        </div>
    );
};

export default TicketingPage;
