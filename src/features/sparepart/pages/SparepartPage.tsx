import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Download,
    FileSpreadsheet,
    FileText,
    Package,
    ChevronDown,
    MapPin,
    Wrench,
} from "lucide-react";
import { SparepartTable } from "../components/SparepartTable";
import { SparepartForm } from "../components/SparepartForm";
import { SparepartDetailModal } from "../components/SparepartDetailModal";
import { sparepartApi } from "../services/sparepart.api";
import type {
    Sparepart,
    SparepartFormData,
    SparepartRegion,
    SparepartType,
    SparepartPhoto,
} from "../types/sparepart.types";

const ITEMS_PER_PAGE = 10;

const SparepartPage = () => {
    const queryClient = useQueryClient();

    // State untuk 3 section
    const [malukuPage, setMalukuPage] = useState(1);
    const [papuaPage, setPapuaPage] = useState(1);
    const [toolsAlkerPage, setToolsAlkerPage] = useState(1);

    // Filter state per section
    const [malukuFilter, setMalukuFilter] = useState<{
        kabupaten?: string;
        cluster?: string;
        search?: string;
    }>({});
    const [papuaFilter, setPapuaFilter] = useState<{
        kabupaten?: string;
        cluster?: string;
        search?: string;
    }>({});
    const [toolsAlkerFilter, setToolsAlkerFilter] = useState<{
        kabupaten?: string;
        cluster?: string;
        search?: string;
    }>({});

    // Sparepart type filter per section
    const [malukuSparepartTypes, setMalukuSparepartTypes] = useState<string[]>(
        [],
    );
    const [papuaSparepartTypes, setPapuaSparepartTypes] = useState<string[]>(
        [],
    );
    const [toolsAlkerSparepartTypes, setToolsAlkerSparepartTypes] = useState<
        string[]
    >([]);

    // Form state
    const [formOpen, setFormOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Sparepart | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [activeSection, setActiveSection] = useState<
        "maluku" | "papua" | "tools_alker"
    >("maluku");
    const [formData, setFormData] = useState<SparepartFormData>({
        kabupaten: "",
        cluster: "",
        region: "maluku",
        type: "stok",
    });

    // Export state
    const [isExportingMaluku, setIsExportingMaluku] = useState(false);
    const [isExportingPapua, setIsExportingPapua] = useState(false);
    const [isExportingToolsAlker, setIsExportingToolsAlker] = useState(false);

    // Helper function to download file
    const downloadFile = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    // Fetch data untuk setiap section secara terpisah
    const { data: malukuData, isLoading: isLoadingMaluku } = useQuery({
        queryKey: ["sparepart", "maluku", malukuPage, malukuFilter],
        queryFn: () =>
            sparepartApi.getSparepartStocks({
                region: "maluku",
                regency: malukuFilter.kabupaten,
                cluster: malukuFilter.cluster,
                search: malukuFilter.search,
                page: malukuPage,
                limit: ITEMS_PER_PAGE,
            }),
    });

    const { data: papuaData, isLoading: isLoadingPapua } = useQuery({
        queryKey: ["sparepart", "papua", papuaPage, papuaFilter],
        queryFn: () =>
            sparepartApi.getSparepartStocks({
                region: "papua",
                regency: papuaFilter.kabupaten,
                cluster: papuaFilter.cluster,
                search: papuaFilter.search,
                page: papuaPage,
                limit: ITEMS_PER_PAGE,
            }),
    });

    const { data: toolsAlkerData, isLoading: isLoadingToolsAlker } = useQuery({
        queryKey: [
            "sparepart",
            "tools_alker",
            toolsAlkerPage,
            toolsAlkerFilter,
        ],
        queryFn: () =>
            sparepartApi.getToolsAlkers({
                regency: toolsAlkerFilter.kabupaten,
                cluster: toolsAlkerFilter.cluster,
                search: toolsAlkerFilter.search,
                page: toolsAlkerPage,
                limit: ITEMS_PER_PAGE,
            }),
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: ({
            data,
            apiType,
        }: {
            data: SparepartFormData;
            apiType: "stock" | "tools-alker";
        }) => {
            if (apiType === "tools-alker") {
                return sparepartApi.createToolsAlker(data);
            }
            return sparepartApi.createSparepartStock(data);
        },
        onSuccess: () => {
            toast.success("Data sparepart berhasil ditambahkan");
            queryClient.invalidateQueries({ queryKey: ["sparepart"] });
            setFormOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error("Gagal menambahkan data", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({
            id,
            data,
            apiType,
        }: {
            id: number;
            data: SparepartFormData;
            apiType: "stock" | "tools-alker";
        }) => {
            if (apiType === "tools-alker") {
                return sparepartApi.updateToolsAlker(id, data);
            }
            return sparepartApi.updateSparepartStock(id, data);
        },
        onSuccess: () => {
            toast.success("Data sparepart berhasil diupdate");
            queryClient.invalidateQueries({ queryKey: ["sparepart"] });
            setFormOpen(false);
            resetForm();
        },
        onError: (error) => {
            toast.error("Gagal update data", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: ({
            id,
            apiType,
        }: {
            id: number;
            apiType: "stock" | "tools-alker";
        }) => {
            if (apiType === "tools-alker") {
                return sparepartApi.deleteToolsAlker(id);
            }
            return sparepartApi.deleteSparepartStock(id);
        },
        onSuccess: () => {
            toast.success("Data sparepart berhasil dihapus");
            queryClient.invalidateQueries({ queryKey: ["sparepart"] });
            setDeleteDialogOpen(false);
            setSelectedItem(null);
        },
        onError: (error) => {
            toast.error("Gagal menghapus data", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        },
    });

    const resetForm = () => {
        setFormData({
            kabupaten: "",
            cluster: "",
            region:
                activeSection === "tools_alker"
                    ? "maluku"
                    : (activeSection as SparepartRegion),
            type: activeSection === "tools_alker" ? "tools_alker" : "stok",
        });
        setEditingId(null);
    };

    const handleAdd = (section: "maluku" | "papua" | "tools_alker") => {
        setActiveSection(section);
        resetForm();
        setExistingPhotosStok([]);
        setExistingPhotosBekas([]);
        setFormData((prev) => ({
            ...prev,
            region:
                section === "tools_alker"
                    ? "maluku"
                    : (section as SparepartRegion),
            type: section === "tools_alker" ? "tools_alker" : "stok",
        }));
        setFormOpen(true);
    };

    const [existingPhotosStok, setExistingPhotosStok] = useState<
        SparepartPhoto[]
    >([]);
    const [existingPhotosBekas, setExistingPhotosBekas] = useState<
        SparepartPhoto[]
    >([]);

    const handleEdit = async (item: Sparepart) => {
        setEditingId(item.id);
        try {
            // Fetch detail data berdasarkan type
            // Note: item.id adalah location_id dari grouped response
            let detailData: Sparepart;
            if (item.type === "tools_alker") {
                // Pass region, regency, cluster untuk filter yang lebih spesifik
                detailData = await sparepartApi.getToolsAlkerById(
                    item.id,
                    item.region,
                    item.kabupaten,
                    item.cluster,
                );
                setActiveSection("tools_alker");
            } else {
                // Pass region, regency, cluster untuk filter yang lebih spesifik
                detailData = await sparepartApi.getSparepartStockById(
                    item.id,
                    item.region,
                    item.kabupaten,
                    item.cluster,
                );
                setActiveSection(item.region === "maluku" ? "maluku" : "papua");
            }

            if (!detailData) {
                throw new Error("Data tidak ditemukan");
            }

            // location_id sudah tersedia dari item.id (yang adalah location_id dari grouped response)
            // Tapi untuk memastikan, kita bisa fetch lagi atau gunakan item.id langsung
            let locationId: number | undefined = item.id; // item.id adalah location_id dari grouped response

            // Verifikasi dengan fetch location jika diperlukan
            try {
                const locations = await sparepartApi.getLocations({
                    region: detailData.region,
                    regency: detailData.kabupaten,
                    cluster: detailData.cluster,
                    page: 1,
                    limit: 1,
                });
                // Gunakan location_id dari fetch jika berbeda (untuk validasi)
                if (
                    locations.data[0]?.id &&
                    locations.data[0].id !== locationId
                ) {
                    console.warn(
                        "Location ID mismatch:",
                        locationId,
                        "vs",
                        locations.data[0].id,
                    );
                    locationId = locations.data[0].id; // Gunakan yang dari fetch
                }
            } catch (locationError) {
                console.warn("Failed to fetch location:", locationError);
                // Continue dengan item.id sebagai location_id
            }

            // Fetch contact person berdasarkan location_id untuk mendapatkan PIC dan kontak
            let pic = detailData.pic || "";
            let kontak = detailData.kontak || "";
            if (locationId) {
                try {
                    const contactPersons = await sparepartApi.getContactPersons(
                        {
                            location_id: locationId,
                            page: 1,
                            limit: 1,
                        },
                    );
                    if (contactPersons.data.length > 0) {
                        const cp = contactPersons.data[0];
                        pic = cp.pic || pic;
                        kontak = cp.phone || kontak;
                    }
                } catch (cpError) {
                    console.warn("Failed to fetch contact person:", cpError);
                    // Use existing pic/kontak from detailData if fetch fails
                }
            }

            // Set existing photos untuk stok dan bekas secara terpisah
            setExistingPhotosStok(detailData.dokumentasiStok || []);
            setExistingPhotosBekas(detailData.dokumentasiBekas || []);

            setFormData({
                location_id: locationId,
                kabupaten: detailData.kabupaten || "",
                cluster: detailData.cluster || "",
                region: detailData.region,
                type: detailData.type,
                sparepartStok: detailData.sparepartStok || [],
                sparepartBekas: detailData.sparepartBekas || [],
                catatan: detailData.catatan || "",
                pic: pic,
                kontak: kontak,
            });
            setFormOpen(true);
        } catch (error) {
            console.error("Error in handleEdit:", error);
            toast.error("Gagal memuat data detail", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
            setEditingId(null);
        }
    };

    const handleDelete = (id: number) => {
        // Find item from all sections
        const allData = [
            ...(malukuData?.data || []),
            ...(papuaData?.data || []),
            ...(toolsAlkerData?.data || []),
        ];
        const item = allData.find((d) => d.id === id);
        if (item) {
            setSelectedItem(item);
            setDeleteDialogOpen(true);
        }
    };

    const handleSubmit = (data: SparepartFormData) => {
        if (editingId) {
            if (data.type === "tools_alker") {
                updateMutation.mutate({
                    id: editingId,
                    data,
                    apiType: "tools-alker",
                });
            } else {
                updateMutation.mutate({
                    id: editingId,
                    data,
                    apiType: "stock",
                });
            }
        } else {
            if (data.type === "tools_alker") {
                createMutation.mutate({ data, apiType: "tools-alker" });
            } else {
                createMutation.mutate({ data, apiType: "stock" });
            }
        }
    };

    // Export functions
    const handleExportExcel = async (
        section: "maluku" | "papua" | "tools_alker",
    ) => {
        const sectionData =
            section === "tools_alker"
                ? {
                      filter: toolsAlkerFilter,
                      setIsExporting: setIsExportingToolsAlker,
                  }
                : section === "maluku"
                  ? {
                        filter: malukuFilter,
                        setIsExporting: setIsExportingMaluku,
                    }
                  : {
                        filter: papuaFilter,
                        setIsExporting: setIsExportingPapua,
                    };

        sectionData.setIsExporting(true);
        try {
            if (section === "tools_alker") {
                const exportParams = {
                    regency: sectionData.filter.kabupaten,
                    cluster: sectionData.filter.cluster,
                };
                const result =
                    await sparepartApi.exportToolsAlkerToExcel(exportParams);
                downloadFile(result.blob, result.filename);
            } else {
                const exportParams = {
                    region: section as SparepartRegion,
                    regency: sectionData.filter.kabupaten,
                    cluster: sectionData.filter.cluster,
                };
                const result =
                    await sparepartApi.exportStockToExcel(exportParams);
                downloadFile(result.blob, result.filename);
            }
            toast.success("Export Excel berhasil");
        } catch (error) {
            toast.error("Gagal export Excel", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            sectionData.setIsExporting(false);
        }
    };

    const handleExportPDF = async (
        section: "maluku" | "papua" | "tools_alker",
    ) => {
        const sectionData =
            section === "tools_alker"
                ? {
                      filter: toolsAlkerFilter,
                      setIsExporting: setIsExportingToolsAlker,
                  }
                : section === "maluku"
                  ? {
                        filter: malukuFilter,
                        setIsExporting: setIsExportingMaluku,
                    }
                  : {
                        filter: papuaFilter,
                        setIsExporting: setIsExportingPapua,
                    };

        sectionData.setIsExporting(true);
        try {
            if (section === "tools_alker") {
                const exportParams = {
                    regency: sectionData.filter.kabupaten,
                    cluster: sectionData.filter.cluster,
                };
                const result =
                    await sparepartApi.exportToolsAlkerToPDF(exportParams);
                downloadFile(result.blob, result.filename);
            } else {
                const exportParams = {
                    region: section as SparepartRegion,
                    regency: sectionData.filter.kabupaten,
                    cluster: sectionData.filter.cluster,
                };
                const result =
                    await sparepartApi.exportStockToPDF(exportParams);
                downloadFile(result.blob, result.filename);
            }
            toast.success("Export PDF berhasil");
        } catch (error) {
            toast.error("Gagal export PDF", {
                description:
                    error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            sectionData.setIsExporting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="mb-8 animate-fade-in">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Manajemen Sparepart
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Kelola data sparepart dan tools alat kerja
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Region Maluku Section */}
            <section className="mb-6 animate-slide-up">
                <div className="bg-card rounded-lg p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                Sparepart Region Maluku
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isExportingMaluku}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExportingMaluku
                                            ? "Exporting..."
                                            : "Export"}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleExportExcel("maluku")
                                        }
                                        disabled={isExportingMaluku}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export ke Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleExportPDF("maluku")
                                        }
                                        disabled={isExportingMaluku}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export ke PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                onClick={() => handleAdd("maluku")}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Data
                            </Button>
                        </div>
                    </div>
                    <SparepartTable
                        data={malukuData?.data || []}
                        isLoading={isLoadingMaluku}
                        onView={(item) => {
                            setSelectedItem(item);
                            setDetailModalOpen(true);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        filter={malukuFilter}
                        onFilterChange={(filter) => {
                            setMalukuFilter(filter);
                            setMalukuPage(1);
                        }}
                        currentPage={malukuData?.pagination?.page || 1}
                        totalPages={malukuData?.pagination?.totalPages || 1}
                        totalItems={malukuData?.pagination?.total || 0}
                        onPageChange={setMalukuPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        selectedSparepartTypes={malukuSparepartTypes}
                        onSparepartTypeFilterChange={setMalukuSparepartTypes}
                    />
                </div>
            </section>

            {/* Region Papua Section */}
            <section className="mb-6 animate-slide-up">
                <div className="bg-card rounded-lg p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                Sparepart Region Papua
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isExportingPapua}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExportingPapua
                                            ? "Exporting..."
                                            : "Export"}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleExportExcel("papua")
                                        }
                                        disabled={isExportingPapua}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export ke Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => handleExportPDF("papua")}
                                        disabled={isExportingPapua}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export ke PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                onClick={() => handleAdd("papua")}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Data
                            </Button>
                        </div>
                    </div>
                    <SparepartTable
                        data={papuaData?.data || []}
                        isLoading={isLoadingPapua}
                        onView={(item) => {
                            setSelectedItem(item);
                            setDetailModalOpen(true);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        filter={papuaFilter}
                        onFilterChange={(filter) => {
                            setPapuaFilter(filter);
                            setPapuaPage(1);
                        }}
                        currentPage={papuaData?.pagination?.page || 1}
                        totalPages={papuaData?.pagination?.totalPages || 1}
                        totalItems={papuaData?.pagination?.total || 0}
                        onPageChange={setPapuaPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        selectedSparepartTypes={papuaSparepartTypes}
                        onSparepartTypeFilterChange={setPapuaSparepartTypes}
                    />
                </div>
            </section>

            {/* Tools Alker Section */}
            <section className="mb-6 animate-slide-up">
                <div className="bg-card rounded-lg p-6 border shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                Inventory Tools Alker
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={isExportingToolsAlker}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        {isExportingToolsAlker
                                            ? "Exporting..."
                                            : "Export"}
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleExportExcel("tools_alker")
                                        }
                                        disabled={isExportingToolsAlker}
                                    >
                                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                                        Export ke Excel
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            handleExportPDF("tools_alker")
                                        }
                                        disabled={isExportingToolsAlker}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Export ke PDF
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                                onClick={() => handleAdd("tools_alker")}
                                size="sm"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Data
                            </Button>
                        </div>
                    </div>
                    <SparepartTable
                        data={toolsAlkerData?.data || []}
                        isLoading={isLoadingToolsAlker}
                        onView={(item) => {
                            setSelectedItem(item);
                            setDetailModalOpen(true);
                        }}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        filter={toolsAlkerFilter}
                        onFilterChange={(filter) => {
                            setToolsAlkerFilter(filter);
                            setToolsAlkerPage(1);
                        }}
                        currentPage={toolsAlkerData?.pagination?.page || 1}
                        totalPages={toolsAlkerData?.pagination?.totalPages || 1}
                        totalItems={toolsAlkerData?.pagination?.total || 0}
                        onPageChange={setToolsAlkerPage}
                        itemsPerPage={ITEMS_PER_PAGE}
                        selectedSparepartTypes={toolsAlkerSparepartTypes}
                        onSparepartTypeFilterChange={
                            setToolsAlkerSparepartTypes
                        }
                        isToolsAlker={true}
                    />
                </div>
            </section>

            {/* Form Dialog */}
            <Dialog open={formOpen} onOpenChange={setFormOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? "Edit" : "Tambah"} Data Sparepart
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? "Ubah data sparepart"
                                : "Masukkan data sparepart baru"}
                        </DialogDescription>
                    </DialogHeader>
                    <SparepartForm
                        formData={formData}
                        editingId={editingId}
                        existingPhotosStok={existingPhotosStok}
                        existingPhotosBekas={existingPhotosBekas}
                        isSubmitting={
                            createMutation.isPending || updateMutation.isPending
                        }
                        onChange={setFormData}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setFormOpen(false);
                            resetForm();
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Detail Modal */}
            <SparepartDetailModal
                open={detailModalOpen}
                onOpenChange={setDetailModalOpen}
                data={selectedItem}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Hapus Data Sparepart
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data sparepart
                            ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedItem) {
                                    const apiType =
                                        selectedItem.type === "tools_alker"
                                            ? "tools-alker"
                                            : "stock";
                                    deleteMutation.mutate({
                                        id: selectedItem.id,
                                        apiType,
                                    });
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default SparepartPage;
