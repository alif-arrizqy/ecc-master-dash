import { useState, useMemo, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Image as ImageIcon,
    X,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type {
    Sparepart,
    SparepartItem,
    SparepartPhoto,
} from "../types/sparepart.types";
import { PhotoGalleryModal } from "./PhotoGalleryModal";
import { sparepartApi } from "../services/sparepart.api";

interface SparepartTableProps {
    data: Sparepart[];
    isLoading?: boolean;
    onView: (item: Sparepart) => void;
    onEdit: (item: Sparepart) => void;
    onDelete: (id: number) => void;
    filter?: {
        kabupaten?: string;
        cluster?: string;
        search?: string;
    };
    onFilterChange?: (filter: {
        kabupaten?: string;
        cluster?: string;
        search?: string;
    }) => void;
    currentPage?: number;
    totalPages?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    itemsPerPage?: number;
    // Filter untuk jenis sparepart yang ditampilkan
    selectedSparepartTypes?: string[];
    onSparepartTypeFilterChange?: (types: string[]) => void;
    // Untuk tools alker, hanya tampilkan kolom tertentu
    isToolsAlker?: boolean;
}

type SortField =
    | "no"
    | "kabupaten"
    | "cluster"
    | "sparepartStok"
    | "sparepartBekas";
type SortOrder = "asc" | "desc" | null;

export const SparepartTable = ({
    data,
    isLoading,
    onView,
    onEdit,
    onDelete,
    filter = {},
    onFilterChange,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    onPageChange,
    itemsPerPage = 10,
    selectedSparepartTypes = [],
    onSparepartTypeFilterChange,
    isToolsAlker = false,
}: SparepartTableProps) => {
    const [searchQuery, setSearchQuery] = useState(filter.search || "");
    const [localFilter, setLocalFilter] = useState({
        kabupaten: filter.kabupaten || "",
        cluster: filter.cluster || "",
        search: filter.search || "",
    });
    const [sortField, setSortField] = useState<SortField | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    const [photoGalleryOpen, setPhotoGalleryOpen] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<{
        photos: SparepartPhoto[];
        title: string;
    } | null>(null);
    const [sparepartTypeFilterOpen, setSparepartTypeFilterOpen] =
        useState(false);

    // Dynamic sparepart types based on item_type
    const [sparepartTypes, setSparepartTypes] = useState<string[]>([]);
    const [loadingTypes, setLoadingTypes] = useState(false);

    // Fetch sparepart masters based on item_type
    useEffect(() => {
        const fetchSparepartTypes = async () => {
            setLoadingTypes(true);
            try {
                const itemType = isToolsAlker ? "TOOLS_ALKER" : "SPAREPART";
                const response = await sparepartApi.getSparepartMasters({
                    item_type: itemType,
                    limit: 1000,
                });

                // Extract unique sparepart names
                const uniqueNames = [
                    ...new Set(
                        response.data.map(
                            (item: { name: string }) => item.name,
                        ),
                    ),
                ] as string[];
                setSparepartTypes(uniqueNames);
            } catch (error) {
                console.error("Failed to fetch sparepart types:", error);
                setSparepartTypes([]);
            } finally {
                setLoadingTypes(false);
            }
        };

        fetchSparepartTypes();
    }, [isToolsAlker]);

    // Sync local filter with prop filter
    useEffect(() => {
        setLocalFilter({
            kabupaten: filter.kabupaten || "",
            cluster: filter.cluster || "",
            search: filter.search || "",
        });
        setSearchQuery(filter.search || "");
    }, [filter]);

    // Handle filter change
    const handleFilterChange = (key: string, value: string) => {
        const newFilter = { ...localFilter, [key]: value };
        setLocalFilter(newFilter);
        if (onFilterChange) {
            const cleanedFilter: any = {};
            Object.entries(newFilter).forEach(([k, v]) => {
                if (v && v.trim() !== "") {
                    cleanedFilter[k] = v;
                }
            });
            onFilterChange(cleanedFilter);
        }
    };

    // Clear all filters
    const handleClearFilters = () => {
        const emptyFilter = {
            kabupaten: "",
            cluster: "",
            search: "",
        };
        setLocalFilter(emptyFilter);
        setSearchQuery("");
        if (onFilterChange) {
            onFilterChange({});
        }
    };

    // Check if any filter is active
    const hasActiveFilters = Object.values(localFilter).some(
        (v) => v && v.trim() !== "",
    );

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            if (sortOrder === "asc") {
                setSortOrder("desc");
            } else if (sortOrder === "desc") {
                setSortField(null);
                setSortOrder(null);
            } else {
                setSortOrder("asc");
            }
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
    };

    // Filter and sort data
    const filteredAndSortedData = useMemo(() => {
        let filtered = data;

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = data.filter((item) => {
                return (
                    item.kabupaten?.toLowerCase().includes(query) ||
                    item.cluster?.toLowerCase().includes(query) ||
                    item.catatan?.toLowerCase().includes(query) ||
                    item.pic?.toLowerCase().includes(query)
                );
            });
        }

        // Sort data
        const sorted = [...filtered];
        if (!sortField || !sortOrder) return sorted;

        return sorted.sort((a, b) => {
            let aValue: string | number;
            let bValue: string | number;

            switch (sortField) {
                case "no":
                    aValue = a.no || 0;
                    bValue = b.no || 0;
                    break;
                case "kabupaten":
                    aValue = (a.kabupaten || "").toLowerCase();
                    bValue = (b.kabupaten || "").toLowerCase();
                    break;
                case "cluster":
                    aValue = (a.cluster || "").toLowerCase();
                    bValue = (b.cluster || "").toLowerCase();
                    break;
                case "sparepartStok":
                    // Sort by first sparepart name
                    aValue = (a.sparepartStok?.[0]?.name || "").toLowerCase();
                    bValue = (b.sparepartStok?.[0]?.name || "").toLowerCase();
                    break;
                case "sparepartBekas":
                    aValue = (a.sparepartBekas?.[0]?.name || "").toLowerCase();
                    bValue = (b.sparepartBekas?.[0]?.name || "").toLowerCase();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
            if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortOrder, searchQuery]);

    // Client-side pagination (if not handled by parent)
    const paginatedData = useMemo(() => {
        if (onPageChange) {
            // Server-side pagination
            return filteredAndSortedData;
        }
        // Client-side pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredAndSortedData.slice(startIndex, endIndex);
    }, [filteredAndSortedData, currentPage, itemsPerPage, onPageChange]);

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDown className="h-3 w-3" />;
        }
        if (sortOrder === "asc") {
            return <ArrowUp className="h-3 w-3 text-primary" />;
        }
        if (sortOrder === "desc") {
            return <ArrowDown className="h-3 w-3 text-primary" />;
        }
        return <ArrowUpDown className="h-3 w-3" />;
    };

    // Format sparepart items untuk ditampilkan - tampilkan semua data
    const formatSparepartItems = (
        items: SparepartItem[] | undefined,
        type: "stok" | "bekas",
    ) => {
        if (!items || items.length === 0) return "-";

        // Filter berdasarkan selectedSparepartTypes jika ada filter
        let filtered = items;
        if (selectedSparepartTypes && selectedSparepartTypes.length > 0) {
            filtered = items.filter((item) => {
                const itemName = item.name.toUpperCase();
                return selectedSparepartTypes.some((type) =>
                    itemName.includes(type.toUpperCase()),
                );
            });
        }

        if (filtered.length === 0) return "-";

        // Tampilkan semua data dalam format: "Ehub 3 pcs, SCC SRNA 3 pcs, ..."
        const formatted = filtered
            .map((item) => `${item.name} ${item.quantity} ${item.unit}`)
            .join(", ");

        // Truncate if too long (more than 60 characters for compact display)
        const maxLength = 60;
        const displayText =
            formatted.length > maxLength
                ? formatted.substring(0, maxLength) + "..."
                : formatted;

        return (
            <div className="max-w-xs" title={formatted}>
                <span className="text-xs leading-tight">{displayText}</span>
            </div>
        );
    };

    const handleViewPhotos = (photos: SparepartPhoto[], title: string) => {
        setSelectedPhotos({ photos, title });
        setPhotoGalleryOpen(true);
    };

    // Kolom untuk tools alker berbeda dengan sparepart region
    const columns: { key: SortField; label: string }[] = isToolsAlker
        ? [
              { key: "no", label: "No." },
              { key: "kabupaten", label: "Kabupaten" },
              { key: "cluster", label: "Cluster" },
              { key: "sparepartStok", label: "Sparepart Stok" },
          ]
        : [
              { key: "no", label: "No." },
              { key: "kabupaten", label: "Kabupaten" },
              { key: "cluster", label: "Cluster" },
              { key: "sparepartStok", label: "Sparepart Stok" },
              { key: "sparepartBekas", label: "Sparepart Bekas" },
          ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                    <Input
                        placeholder="Cari kabupaten, cluster, catatan..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleFilterChange("search", e.target.value);
                            if (onPageChange) onPageChange(1);
                        }}
                        className="flex-1"
                    />
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                            title="Clear all filters"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Sparepart Type Filter */}
                {onSparepartTypeFilterChange && (
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSparepartTypeFilterOpen(
                                    !sparepartTypeFilterOpen,
                                )
                            }
                        >
                            Filter Sparepart ({selectedSparepartTypes.length})
                        </Button>
                        {sparepartTypeFilterOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 p-4 bg-card border rounded-lg shadow-lg z-10">
                                <div className="space-y-2">
                                    <div className="text-sm font-semibold mb-2">
                                        Pilih Jenis Sparepart:
                                    </div>
                                    {loadingTypes ? (
                                        <div className="text-sm text-muted-foreground">
                                            Loading...
                                        </div>
                                    ) : sparepartTypes.length === 0 ? (
                                        <div className="text-sm text-muted-foreground">
                                            Tidak ada data
                                        </div>
                                    ) : (
                                        sparepartTypes.map((type) => (
                                            <div
                                                key={type}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={`filter-${type}`}
                                                    checked={selectedSparepartTypes.includes(
                                                        type,
                                                    )}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) => {
                                                        if (checked) {
                                                            onSparepartTypeFilterChange(
                                                                [
                                                                    ...selectedSparepartTypes,
                                                                    type,
                                                                ],
                                                            );
                                                        } else {
                                                            onSparepartTypeFilterChange(
                                                                selectedSparepartTypes.filter(
                                                                    (t) =>
                                                                        t !==
                                                                        type,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`filter-${type}`}
                                                    className="text-sm cursor-pointer"
                                                >
                                                    {type}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Results count */}
            {!isLoading && paginatedData.length > 0 && (
                <p className="text-sm text-muted-foreground">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                    {Math.min(currentPage * itemsPerPage, paginatedData.length)}{" "}
                    dari {paginatedData.length} data
                </p>
            )}

            {/* Table */}
            <div className="overflow-x-auto border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map(({ key, label }) => (
                                <TableHead
                                    key={key}
                                    className="cursor-pointer hover:text-foreground transition-colors"
                                    onClick={() => handleSort(key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {label}
                                        {getSortIcon(key)}
                                    </div>
                                </TableHead>
                            ))}
                            <TableHead>Dokumentasi Stok</TableHead>
                            {!isToolsAlker && (
                                <TableHead>Dokumentasi Bekas</TableHead>
                            )}
                            <TableHead>Catatan</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length + (isToolsAlker ? 3 : 4)
                                    }
                                    className="text-center py-12"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <span className="text-muted-foreground">
                                            {searchQuery
                                                ? "Tidak ada data yang sesuai dengan pencarian"
                                                : "Tidak ada data"}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="hover:bg-muted/30 transition-colors"
                                >
                                    <TableCell className="font-medium">
                                        {item.no || item.id}
                                    </TableCell>
                                    <TableCell>
                                        {item.kabupaten || "-"}
                                    </TableCell>
                                    <TableCell>{item.cluster || "-"}</TableCell>
                                    <TableCell>
                                        {formatSparepartItems(
                                            item.sparepartStok,
                                            "stok",
                                        )}
                                    </TableCell>
                                    {!isToolsAlker && (
                                        <TableCell>
                                            {formatSparepartItems(
                                                item.sparepartBekas,
                                                "bekas",
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        {item.dokumentasiStok &&
                                        item.dokumentasiStok.length > 0 ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleViewPhotos(
                                                        item.dokumentasiStok ||
                                                            [],
                                                        "Dokumentasi Stok",
                                                    )
                                                }
                                            >
                                                <ImageIcon className="h-4 w-4 mr-1" />
                                                View Photo (
                                                {item.dokumentasiStok.length})
                                            </Button>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    {!isToolsAlker && (
                                        <TableCell>
                                            {item.dokumentasiBekas &&
                                            item.dokumentasiBekas.length > 0 ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewPhotos(
                                                            item.dokumentasiBekas ||
                                                                [],
                                                            "Dokumentasi Bekas",
                                                        )
                                                    }
                                                >
                                                    <ImageIcon className="h-4 w-4 mr-1" />
                                                    View Photo (
                                                    {
                                                        item.dokumentasiBekas
                                                            .length
                                                    }
                                                    )
                                                </Button>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                    )}
                                    <TableCell
                                        className="max-w-xs truncate"
                                        title={item.catatan || ""}
                                    >
                                        {item.catatan || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onView(item)}
                                                title="View Detail"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(item)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    onDelete(item.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!isLoading && paginatedData.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        Halaman {currentPage} dari {totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange &&
                                onPageChange(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        type="button"
                                        variant={
                                            currentPage === pageNum
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            onPageChange &&
                                            onPageChange(pageNum)
                                        }
                                        className="w-8"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            },
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange &&
                                onPageChange(
                                    Math.min(totalPages, currentPage + 1),
                                )
                            }
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Photo Gallery Modal */}
            {selectedPhotos && (
                <PhotoGalleryModal
                    photos={selectedPhotos.photos}
                    open={photoGalleryOpen}
                    onOpenChange={setPhotoGalleryOpen}
                    title={selectedPhotos.title}
                />
            )}
        </div>
    );
};
