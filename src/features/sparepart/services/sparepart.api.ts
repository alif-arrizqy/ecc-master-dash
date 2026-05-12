import { sparepartApiClient } from "@/lib/api";
import type { ApiResponse } from "@/shared/lib/api";
import type {
    Sparepart,
    SparepartFormData,
    SparepartFilter,
    SparepartExportParams,
    SparepartRegion,
    SparepartType,
    SparepartItem,
    SparepartPhoto,
    SparepartMaster,
    DocumentationDraft,
} from "../types/sparepart.types";

/**
 * Backend may return documentation either as a legacy `string[]` (older
 * records) or as the new `{ path; date? }` object form (after the schema
 * refactor). The mapping helpers below accept both shapes transparently.
 */
type BackendDocumentationEntry = string | { path: string; date?: string };

interface BackendStockItemNew {
    id: number;
    location_id: number;
    location: {
        id: number;
        region: "PAPUA" | "MALUKU";
        regency: string;
        cluster: string;
        created_at: string;
        updated_at: string;
    };
    sparepart: Array<{
        id: number;
        stock_id?: number; // Added stock_id
        name: string;
        item_type: string;
        stock_type: "NEW_STOCK" | "USED_STOCK";
        quantity: number;
        documentation: BackendDocumentationEntry[];
        notes?: string;
    }>;
    created_at: string;
    updated_at: string;
}

interface BackendToolsAlkerItemNew {
    id: number;
    location_id: number;
    location: {
        id: number;
        region: "PAPUA" | "MALUKU";
        regency: string;
        cluster: string;
        created_at: string;
        updated_at: string;
    };
    tools: Array<{
        id: number;
        stock_id?: number; // Added stock_id (assuming consistency)
        name: string;
        item_type: string;
        quantity: number;
        condition: string;
        documentation: BackendDocumentationEntry[];
        notes?: string;
    }>;
    created_at: string;
    updated_at: string;
}

/**
 * Resolves a raw documentation entry (string or object) into the
 * frontend-friendly { url, date? } pair, prefixing the host when the path is
 * relative.
 */
const resolveDocumentationEntry = (
    raw: BackendDocumentationEntry,
): { url: string; date?: string } => {
    const baseURL = import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
    const cleanBase = baseURL.replace(/\/$/, "");
    const path = typeof raw === "string" ? raw : raw.path;
    const date = typeof raw === "string" ? undefined : raw.date;

    let fullUrl = path;
    if (path && !/^https?:\/\//i.test(path)) {
        fullUrl = `${cleanBase}${path.startsWith("/") ? path : `/${path}`}`;
    }
    return { url: fullUrl, date };
};

const formatDocumentationCaption = (date?: string): string | undefined => {
    if (!date) return undefined;
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

/**
 * Normalises the diverse "delete" input shapes (single id, list of ids,
 * or a full row) into a flat list of `sparepart_stock_item.id` /
 * `tools_alker_item.id` values that the backend can accept directly.
 */
const resolveSparepartStockIds = (
    input: number | number[] | Sparepart,
): number[] => {
    if (typeof input === "number") {
        return Number.isFinite(input) ? [input] : [];
    }
    if (Array.isArray(input)) {
        return input.filter((n) => Number.isFinite(n)) as number[];
    }

    const ids = new Set<number>();
    for (const list of [input.sparepartStok, input.sparepartBekas]) {
        if (!list) continue;
        for (const item of list) {
            if (typeof item.stockId === "number" && item.stockId > 0) {
                ids.add(item.stockId);
            }
        }
    }
    return Array.from(ids);
};

// ...

interface BackendStockResponse {
    data: BackendStockItemNew[];
    // ... pagination
}

// Helper to map backend response to frontend data
const mapBackendToFrontendNew = (
    data: BackendStockItemNew[] | BackendToolsAlkerItemNew[],
    type: "stock" | "tools-alker",
): Sparepart[] => {
    // Group by unique key (Region + Regency + Cluster + StockType)
    // Actually the backend response IS already grouped by Location.
    // Each item in `data` corresponds to a Location Group.

    // We can map 1-to-1 if we split by stock_type for frontend purposes if needed,
    // but the backend response separates `NEW_STOCK` and `USED_STOCK` inside `sparepart` array.

    // However, the previous implementation grouped by key.
    // Let's stick to the previous logic but update the ID mapping.

    const grouped = new Map<string, BackendStockItemNew[]>(); // simplified type for key map

    // ... (Wait, the data structure is array of groups)
    // Let's look at how the previous implementation processed specific items.
    // It iterated `data` and built `grouped` map.

    // RE-IMPLEMENTING mapBackendToFrontendNew fully to ensure correctness:

    const result: Sparepart[] = [];
    let no = 1;
    // We shouldn't depend on idCounter for 'id' if we want stable IDs, but the frontend treats 'id' as synthetic row ID.
    // We will keep synthetic ID for the Row, but use stockId inside items.
    // let idCounter = 1; // Removed as we use location_id

    // Note: The input `data` is already grouped by Location from the backend.

    data.forEach((groupItem) => {
        // groupItem is the Grouped Response (Location)
        // We might need to split this into multiple Frontend Rows if "type" differs?
        // Frontend has 'type': 'stok' | 'bekas' | 'tools_alker'.
        // Backend 'sparepart' array contains both NEW and USED.
        // So we might split one Backend Group into two Frontend Rows (Stok and Bekas).

        const loc = groupItem.location;
        const region: SparepartRegion =
            loc.region === "PAPUA" ? "papua" : "maluku";

        if (type === "stock") {
            const item = groupItem as BackendStockItemNew;

            // Collect NEW Stock
            const newStockItems = item.sparepart.filter(
                (s) => s.stock_type === "NEW_STOCK",
            );
            const sparepartStok: SparepartItem[] = [];
            const dokumentasiStok: SparepartPhoto[] = [];
            let notesStok = "";

            newStockItems.forEach((s) => {
                sparepartStok.push({
                    id: String(s.id),
                    stockId: s.stock_id,
                    name: s.name,
                    quantity: s.quantity,
                    unit: "pcs",
                    stock_type: s.stock_type,
                });

                if (!notesStok && s.notes) notesStok = s.notes;

                s.documentation.forEach((doc, idx) => {
                    const { url, date } = resolveDocumentationEntry(doc);
                    dokumentasiStok.push({
                        id: `${s.stock_id || s.id}-stok-${idx}`,
                        url,
                        documentationDate: date,
                        caption: formatDocumentationCaption(date),
                    });
                });
            });

            // Collect USED Stock
            const usedStockItems = item.sparepart.filter(
                (s) => s.stock_type === "USED_STOCK",
            );
            const sparepartBekas: SparepartItem[] = [];
            const dokumentasiBekas: SparepartPhoto[] = [];
            let notesBekas = "";

            usedStockItems.forEach((s) => {
                sparepartBekas.push({
                    id: String(s.id),
                    stockId: s.stock_id,
                    name: s.name,
                    quantity: s.quantity,
                    unit: "pcs",
                    stock_type: s.stock_type,
                });

                if (!notesBekas && s.notes) notesBekas = s.notes;

                s.documentation.forEach((doc, idx) => {
                    const { url, date } = resolveDocumentationEntry(doc);
                    dokumentasiBekas.push({
                        id: `${s.stock_id || s.id}-bekas-${idx}`,
                        url,
                        documentationDate: date,
                        caption: formatDocumentationCaption(date),
                    });
                });
            });

            // Merge into ONE row if either exists
            if (sparepartStok.length > 0 || sparepartBekas.length > 0) {
                result.push({
                    id: item.location_id, // Use REAL Location ID
                    no: no++,
                    kabupaten: loc.regency,
                    cluster: loc.cluster,
                    region: region,
                    type: sparepartStok.length > 0 ? "stok" : "bekas", // Default to stok if available
                    sparepartStok:
                        sparepartStok.length > 0 ? sparepartStok : undefined,
                    dokumentasiStok:
                        dokumentasiStok.length > 0
                            ? dokumentasiStok
                            : undefined,
                    sparepartBekas:
                        sparepartBekas.length > 0 ? sparepartBekas : undefined,
                    dokumentasiBekas:
                        dokumentasiBekas.length > 0
                            ? dokumentasiBekas
                            : undefined,
                    catatan: notesStok || notesBekas, // Use one of them
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                });
            }
        } else {
            // Tools Alker
            const item = groupItem as BackendToolsAlkerItemNew;
            const sparepartStok: SparepartItem[] = [];
            const dokumentasiStok: SparepartPhoto[] = [];
            let notes = "";

            (item.tools || []).forEach((t) => {
                sparepartStok.push({
                    id: String(t.id),
                    stockId: t.stock_id,
                    name: t.name,
                    quantity: t.quantity,
                    unit: "unit", // default?
                });

                if (!notes && t.notes) notes = t.notes;

                (t.documentation || []).forEach((doc, idx) => {
                    const { url, date } = resolveDocumentationEntry(doc);
                    dokumentasiStok.push({
                        id: `${t.stock_id || t.id}-tools-${idx}`,
                        url,
                        documentationDate: date,
                        caption: formatDocumentationCaption(date),
                    });
                });
            });

            if (sparepartStok.length > 0) {
                result.push({
                    id: item.location_id, // Use REAL Location ID
                    no: no++,
                    kabupaten: loc.regency,
                    cluster: loc.cluster,
                    region: region,
                    type: "tools_alker",
                    sparepartStok,
                    dokumentasiStok,
                    catatan: notes,
                    createdAt: item.created_at,
                    updatedAt: item.updated_at,
                });
            }
        }
    });

    return result;
};

/**
 * OLD Backend response structure (for backward compatibility)
 */
interface BackendStockItem {
    id: number;
    location_id: number;
    sparepart_id: number;
    stock_type: "NEW_STOCK" | "USED_STOCK";
    quantity: number;
    documentation: BackendDocumentationEntry[];
    notes?: string;
    created_at: string;
    updated_at: string;
    location: {
        id: number;
        region: "PAPUA" | "MALUKU";
        regency: string;
        cluster: string;
        created_at: string;
        updated_at: string;
    };
    sparepart: {
        id: number;
        name: string;
        item_type: string;
        created_at: string;
        updated_at: string;
    };
}

interface BackendStockResponse {
    success: boolean;
    message: string;
    data: BackendStockItemNew[] | BackendStockItem[]; // Support both old and new structure
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

/**
 * OLD Map backend response to frontend Sparepart type (for backward compatibility)
 * Group items by location and stock_type
 */
function mapBackendToFrontend(backendItems: BackendStockItem[]): Sparepart[] {
    // Check if new structure (has sparepart as array)
    if (
        backendItems.length > 0 &&
        Array.isArray((backendItems[0] as any).sparepart)
    ) {
        return mapBackendToFrontendNew(
            backendItems as any as BackendStockItemNew[],
            "stock",
        );
    }

    // Old structure - Group by location (regency, cluster)
    const grouped = new Map<string, BackendStockItem[]>();

    backendItems.forEach((item) => {
        const key = `${item.location.regency}|${item.location.cluster}`;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(item);
    });

    // Transform each group to Sparepart
    const result: Sparepart[] = [];
    let no = 1;

    grouped.forEach((items, key) => {
        const firstItem = items[0];
        const [regency, cluster] = key.split("|");

        // Map region
        const region: SparepartRegion =
            firstItem.location.region === "PAPUA" ? "papua" : "maluku";

        // Group sparepart items by stock_type
        const sparepartStok: SparepartItem[] = [];
        const sparepartBekas: SparepartItem[] = [];
        const dokumentasiStok: SparepartPhoto[] = [];
        const dokumentasiBekas: SparepartPhoto[] = [];

        // Collect all notes (use first non-empty note)
        let notesStok = "";
        let notesBekas = "";

        items.forEach((item) => {
            const sparepartItem: SparepartItem = {
                id: String(item.id), // Stock ID
                name: item.sparepart.name,
                quantity: item.quantity,
                unit: "pcs",
                stock_type: item.stock_type,
                stockId: item.id,
            };

            if (item.stock_type === "NEW_STOCK") {
                sparepartStok.push(sparepartItem);

                if (!notesStok && item.notes) notesStok = item.notes;

                item.documentation.forEach((doc, idx) => {
                    const { url, date } = resolveDocumentationEntry(doc);
                    dokumentasiStok.push({
                        id: `${item.id}-stok-${idx}`,
                        url,
                        documentationDate: date,
                        caption: formatDocumentationCaption(date),
                    });
                });
            } else {
                sparepartBekas.push(sparepartItem);

                if (!notesBekas && item.notes) notesBekas = item.notes;

                item.documentation.forEach((doc, idx) => {
                    const { url, date } = resolveDocumentationEntry(doc);
                    dokumentasiBekas.push({
                        id: `${item.id}-bekas-${idx}`,
                        url,
                        documentationDate: date,
                        caption: formatDocumentationCaption(date),
                    });
                });
            }
        });

        result.push({
            id: firstItem.location.id, // Use Location ID as Row ID
            no: no++,
            kabupaten: regency,
            cluster: cluster,
            region: region,
            type: sparepartStok.length > 0 ? "stok" : "bekas",
            sparepartStok: sparepartStok.length > 0 ? sparepartStok : undefined,
            dokumentasiStok:
                dokumentasiStok.length > 0 ? dokumentasiStok : undefined,
            sparepartBekas:
                sparepartBekas.length > 0 ? sparepartBekas : undefined,
            dokumentasiBekas:
                dokumentasiBekas.length > 0 ? dokumentasiBekas : undefined,
            catatan: notesStok || notesBekas,
            createdAt: firstItem.created_at,
            updatedAt: firstItem.updated_at,
        });
    });

    return result;
}

/**
 * Sparepart API
 * Endpoint berdasarkan routes.go:
 * - /api/v1/sparepart/stock (untuk Region Maluku/Papua)
 * - /api/v1/sparepart/tools-alker (untuk Tools Alker)
 */
export const sparepartApi = {
    /**
     * Get sparepart stock items (untuk Region Maluku/Papua)
     * GET /api/v1/sparepart/stock
     * Filters: sparepart_name, region, regency, cluster, stock_type
     */
    getSparepartStocks: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string; // kabupaten
        cluster?: string;
        stock_type?: "stok" | "bekas";
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        // Convert frontend params to backend format
        const backendParams: any = { ...params };
        if (backendParams.region) {
            backendParams.region = backendParams.region.toUpperCase();
        }
        if (backendParams.stock_type) {
            backendParams.stock_type =
                backendParams.stock_type === "stok"
                    ? "NEW_STOCK"
                    : "USED_STOCK";
        }

        const response = await sparepartApiClient.get<BackendStockResponse>(
            "/api/v1/sparepart/stock",
            {
                params: backendParams,
            },
        );

        // Response structure: { success: true, data: [...], pagination: {...} }
        // Axios wraps it, so response.data = { success: true, data: [...], pagination: {...} }
        const responseData = response.data as BackendStockResponse;

        // Check if new structure (sparepart is array)
        const isNewStructure =
            responseData.data.length > 0 &&
            Array.isArray((responseData.data[0] as any).sparepart);

        // Map backend response to frontend format
        const mappedData = isNewStructure
            ? mapBackendToFrontendNew(
                  responseData.data as any as BackendStockItemNew[],
                  "stock",
              )
            : mapBackendToFrontend(
                  responseData.data as any as BackendStockItem[],
              );

        // After grouping, the number of rows is different from backend total
        // We can't calculate exact total groups without processing all data
        // For now, use the mapped data length as the total for this page
        // The actual total should ideally come from backend, but we use mapped length as approximation
        const totalGroups = mappedData.length;
        const limit = params?.limit || 20;
        // If we got less than limit items, this is the last page
        // Otherwise, estimate based on backend total (which is approximate)
        const estimatedTotal =
            responseData.data.length < limit
                ? totalGroups
                : Math.max(
                      totalGroups,
                      Math.ceil(responseData.pagination.total / 3),
                  ); // Rough estimate
        const estimatedTotalPages = Math.max(
            1,
            Math.ceil(estimatedTotal / limit),
        );

        return {
            data: mappedData,
            pagination: {
                page: responseData.pagination.page,
                limit: limit,
                total: totalGroups, // Use grouped count for current page
                totalPages: estimatedTotalPages,
            },
        };
    },

    /**
     * Get tools alker items
     * GET /api/v1/sparepart/tools-alker
     * Filters: sparepart_name, region, regency, cluster
     */
    getToolsAlkers: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string; // kabupaten
        cluster?: string;
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        // Convert frontend params to backend format
        const backendParams: any = { ...params };
        if (backendParams.region) {
            backendParams.region = backendParams.region.toUpperCase();
        }

        const response = await sparepartApiClient.get<BackendStockResponse>(
            "/api/v1/sparepart/tools-alker",
            { params: backendParams },
        );

        // Response structure: { success: true, data: [...], pagination: {...} }
        // Axios wraps it, so response.data = { success: true, data: [...], pagination: {...} }
        const responseData = response.data as any;

        // Tools alker uses new structure with 'tools' array
        const mappedData = mapBackendToFrontendNew(
            responseData.data as BackendToolsAlkerItemNew[],
            "tools-alker",
        );

        // After grouping, the number of rows is different from backend total
        const totalGroups = mappedData.length;
        const limit = params?.limit || 20;
        const estimatedTotal =
            responseData.data.length < limit
                ? totalGroups
                : Math.max(
                      totalGroups,
                      Math.ceil(responseData.pagination.total / 3),
                  ); // Rough estimate
        const estimatedTotalPages = Math.max(
            1,
            Math.ceil(estimatedTotal / limit),
        );

        return {
            data: mappedData,
            pagination: {
                page: responseData.pagination.page,
                limit: limit,
                total: totalGroups, // Use grouped count for current page
                totalPages: estimatedTotalPages,
            },
        };
    },

    /**
     * Create new sparepart master
     * POST /api/v1/sparepart/master
     */
    createSparepartMaster: async (data: {
        name: string;
        item_type: "SPAREPART" | "TOOLS_ALKER";
    }) => {
        const response = await sparepartApiClient.post<
            ApiResponse<SparepartMaster>
        >("/api/v1/sparepart/master", data);
        return response.data.data;
    },

    /**
     * Get sparepart stock by location_id (dari grouped response)
     * Menggunakan GetAll dengan filter region, regency, cluster untuk mendapatkan detail
     *
     * Note: ID yang diterima adalah location_id dari grouped response
     */
    getSparepartStockById: async (
        locationId: number,
        region?: SparepartRegion,
        regency?: string,
        cluster?: string,
    ) => {
        try {
            // Gunakan GetAll dengan filter untuk mendapatkan detail berdasarkan location
            const response = await sparepartApiClient.get<BackendStockResponse>(
                "/api/v1/sparepart/stock",
                {
                    params: {
                        region: region?.toUpperCase(),
                        regency: regency,
                        cluster: cluster,
                        page: 1,
                        limit: 100, // Cukup untuk mendapatkan item yang diinginkan
                    },
                },
            );

            const responseData = response.data as BackendStockResponse;

            if (!responseData.data || responseData.data.length === 0) {
                throw new Error("Data tidak ditemukan");
            }

            // Check if new structure (sparepart is array)
            const isNewStructure = Array.isArray(
                (responseData.data[0] as any).sparepart,
            );

            if (isNewStructure) {
                // New structure - find item dengan location_id yang sesuai
                const backendItems = responseData.data as BackendStockItemNew[];
                const foundItem = backendItems.find(
                    (item) =>
                        item.location_id === locationId ||
                        item.id === locationId,
                );

                if (!foundItem) {
                    throw new Error("Data tidak ditemukan");
                }

                const mapped = mapBackendToFrontendNew([foundItem], "stock");
                return mapped[0];
            } else {
                // Old structure - find item dengan location_id yang sesuai
                const backendItems = responseData.data as BackendStockItem[];
                const foundItem = backendItems.find(
                    (item) => item.location_id === locationId,
                );

                if (!foundItem) {
                    throw new Error("Data tidak ditemukan");
                }

                // Reuse mapBackendToFrontend
                const mapped = mapBackendToFrontend([foundItem]);
                return mapped[0];
            }
        } catch (error) {
            console.error("Error in getSparepartStockById:", error);
            throw error;
        }
    },

    /**
     * Get tools alker by location_id (dari grouped response)
     * Menggunakan GetAll dengan filter region, regency, cluster untuk mendapatkan detail
     *
     * Note: ID yang diterima adalah location_id dari grouped response
     */
    getToolsAlkerById: async (
        locationId: number,
        region?: SparepartRegion,
        regency?: string,
        cluster?: string,
    ) => {
        try {
            // Gunakan GetAll dengan filter untuk mendapatkan detail berdasarkan location
            const response = await sparepartApiClient.get<BackendStockResponse>(
                "/api/v1/sparepart/tools-alker",
                {
                    params: {
                        region: region?.toUpperCase(),
                        regency: regency,
                        cluster: cluster,
                        page: 1,
                        limit: 100, // Cukup untuk mendapatkan item yang diinginkan
                    },
                },
            );

            // Handle different response structures
            const responseData = response.data as any;
            const items = Array.isArray(responseData.data)
                ? responseData.data
                : [];

            if (!items || items.length === 0) {
                throw new Error("Data tidak ditemukan");
            }

            // Find item dengan location_id yang sesuai
            const foundItem = items.find(
                (item: BackendToolsAlkerItemNew) =>
                    item.location_id === locationId || item.id === locationId,
            );

            if (!foundItem) {
                throw new Error("Data tidak ditemukan");
            }

            // Use the unified mapping function
            const mapped = mapBackendToFrontendNew([foundItem], "tools-alker");
            return mapped[0];
        } catch (error) {
            console.error("Error in getToolsAlkerById:", error);
            throw error;
        }
    },

    /**
     * Create new sparepart stock items.
     *
     * Photos in the new schema live on a single stock row (one stock item per
     * sparepart in the location group). To avoid the historical bug where the
     * same bucket of files was attached to every created row, photos are only
     * attached to the FIRST item of each stock type, then any remaining drafts
     * are uploaded via the `addSparepartPhotos` endpoint to that same row.
     *
     * POST /api/v1/sparepart/stock
     */
    createSparepartStock: async (data: SparepartFormData) => {
        if (!data.location_id) {
            throw new Error("Location ID is required");
        }

        const stokItems = data.sparepartStok || [];
        const bekasItems = data.sparepartBekas || [];
        const itemsToCreate = [...stokItems, ...bekasItems];

        if (itemsToCreate.length === 0) {
            throw new Error("No sparepart items to create.");
        }

        const stokDrafts = (data.dokumentasiStok || []).filter((d) => !!d.file);
        const bekasDrafts = (data.dokumentasiBekas || []).filter(
            (d) => !!d.file,
        );

        // We create items sequentially so we can identify the stockId of the
        // first NEW_STOCK / USED_STOCK row and then add the remaining photos
        // to that row.
        const results: ApiResponse<any>[] = [];
        let firstNewStockId: number | null = null;
        let firstUsedStockId: number | null = null;

        for (const item of itemsToCreate) {
            const formData = new FormData();
            formData.append("location_id", String(data.location_id));
            formData.append("sparepart_id", String(item.id));
            formData.append(
                "stock_type",
                item.stock_type === "USED_STOCK" ? "USED_STOCK" : "NEW_STOCK",
            );
            formData.append("quantity", String(item.quantity || 0));
            if (data.catatan) formData.append("notes", data.catatan);

            const response = await sparepartApiClient.post<ApiResponse<any>>(
                "/api/v1/sparepart/stock",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
            results.push(response.data);

            // Walk the grouped response to grab the freshly minted stockId.
            const grouped = response.data?.data as any;
            if (grouped && Array.isArray(grouped.sparepart)) {
                for (const sp of grouped.sparepart) {
                    if (
                        sp.stock_type === "NEW_STOCK" &&
                        firstNewStockId == null &&
                        sp.stock_id
                    ) {
                        firstNewStockId = sp.stock_id;
                    }
                    if (
                        sp.stock_type === "USED_STOCK" &&
                        firstUsedStockId == null &&
                        sp.stock_id
                    ) {
                        firstUsedStockId = sp.stock_id;
                    }
                }
            }
        }

        // Now upload the documentation drafts to whichever row is appropriate.
        if (stokDrafts.length > 0 && firstNewStockId != null) {
            await sparepartApi.addSparepartPhotos(firstNewStockId, stokDrafts);
        }
        if (bekasDrafts.length > 0 && firstUsedStockId != null) {
            await sparepartApi.addSparepartPhotos(
                firstUsedStockId,
                bekasDrafts,
            );
        }

        return null;
    },

    /**
     * Create new tools alker.
     *
     * Photos are attached to the FIRST created tools row only; any remaining
     * documentation drafts are uploaded via `addToolsAlkerPhotos` (when that
     * endpoint is available on the backend) so they don't get duplicated
     * across rows.
     *
     * POST /api/v1/sparepart/tools-alker
     */
    createToolsAlker: async (data: SparepartFormData) => {
        const itemsToCreate = data.sparepartStok || [];
        if (itemsToCreate.length === 0) {
            throw new Error("No tools alker items to create.");
        }

        const drafts = (data.dokumentasiStok || []).filter((d) => !!d.file);
        let firstStockId: number | null = null;

        for (const item of itemsToCreate) {
            const formData = new FormData();
            formData.append("regency", data.kabupaten);
            formData.append("cluster", data.cluster);
            formData.append("region", data.region);
            formData.append("sparepart_id", String(item.id));
            formData.append("quantity", String(item.quantity || 0));
            if (data.catatan) formData.append("notes", data.catatan);
            if (data.pic) formData.append("pic", data.pic);
            if (data.kontak) formData.append("contact", data.kontak);

            const response = await sparepartApiClient.post<ApiResponse<any>>(
                "/api/v1/sparepart/tools-alker",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            const grouped = response.data?.data as any;
            if (
                firstStockId == null &&
                grouped &&
                Array.isArray(grouped.tools)
            ) {
                const target = grouped.tools.find(
                    (t: any) => t.stock_id || t.id,
                );
                if (target) firstStockId = target.stock_id || target.id;
            }
        }

        if (drafts.length > 0 && firstStockId != null) {
            await sparepartApi.addToolsAlkerPhotos(firstStockId, drafts);
        }
        return null;
    },

    /**
     * Update an existing sparepart stock location group.
     *
     * Splits the work in three:
     *   1. Existing rows (have stockId) -> PUT quantity/notes.
     *   2. Brand new rows (no stockId)  -> POST /stock without photos so the
     *      backend can return the new stock_id; collect the new stockIds for
     *      NEW_STOCK/USED_STOCK.
     *   3. Documentation drafts          -> sent ONCE through
     *      `addSparepartPhotos` to the first available stockId of the matching
     *      type (existing or newly created). This eliminates the previous bug
     *      where photos were uploaded twice (during POST and again via
     *      addSparepartPhotos).
     *
     * PUT /api/v1/sparepart/stock/{id}
     */
    updateSparepartStock: async (id: number, data: SparepartFormData) => {
        const items = [
            ...(data.sparepartStok || []),
            ...(data.sparepartBekas || []),
        ];

        let firstNewStockTargetId =
            data.sparepartStok?.find((i) => i.stockId)?.stockId || null;
        let firstUsedStockTargetId =
            data.sparepartBekas?.find((i) => i.stockId)?.stockId || null;

        for (const item of items) {
            if (item.stockId) {
                await sparepartApiClient.put(
                    `/api/v1/sparepart/stock/${item.stockId}`,
                    {
                        quantity: Number(item.quantity),
                        notes: data.catatan || undefined,
                    },
                );
                continue;
            }

            const formData = new FormData();
            formData.append("location_id", String(id));
            formData.append("sparepart_id", String(item.id));
            formData.append(
                "stock_type",
                item.stock_type === "USED_STOCK" ? "USED_STOCK" : "NEW_STOCK",
            );
            formData.append("quantity", String(item.quantity || 0));
            if (data.catatan) formData.append("notes", data.catatan);

            const response = await sparepartApiClient.post<ApiResponse<any>>(
                "/api/v1/sparepart/stock",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            const grouped = response.data?.data as any;
            if (grouped && Array.isArray(grouped.sparepart)) {
                for (const sp of grouped.sparepart) {
                    if (
                        sp.stock_type === "NEW_STOCK" &&
                        firstNewStockTargetId == null &&
                        sp.stock_id
                    ) {
                        firstNewStockTargetId = sp.stock_id;
                    }
                    if (
                        sp.stock_type === "USED_STOCK" &&
                        firstUsedStockTargetId == null &&
                        sp.stock_id
                    ) {
                        firstUsedStockTargetId = sp.stock_id;
                    }
                }
            }
        }

        const stokDrafts = (data.dokumentasiStok || []).filter((d) => !!d.file);
        const bekasDrafts = (data.dokumentasiBekas || []).filter(
            (d) => !!d.file,
        );
        if (stokDrafts.length > 0 && firstNewStockTargetId != null) {
            await sparepartApi.addSparepartPhotos(
                firstNewStockTargetId,
                stokDrafts,
            );
        }
        if (bekasDrafts.length > 0 && firstUsedStockTargetId != null) {
            await sparepartApi.addSparepartPhotos(
                firstUsedStockTargetId,
                bekasDrafts,
            );
        }

        return true;
    },

    /**
     * Add photos to a sparepart stock row.
     *
     * Accepts either `File[]` (legacy callers) or `DocumentationDraft[]`
     * (current form). For each draft, the optional `date` is forwarded to the
     * backend via `documentation_dates` (JSON array string), aligned by index
     * with the `photos` files.
     *
     * POST /api/v1/sparepart/stock/{id}/photos
     */
    addSparepartPhotos: async (
        id: number,
        photos: File[] | DocumentationDraft[],
    ) => {
        const drafts: DocumentationDraft[] = photos
            .map((p, idx): DocumentationDraft | null => {
                if (p instanceof File) {
                    return { id: `${idx}-${p.name}`, file: p };
                }
                if (p && p.file) return p;
                return null;
            })
            .filter((d): d is DocumentationDraft => d !== null);

        if (drafts.length === 0) return null;

        const formData = new FormData();
        drafts.forEach((d) => {
            if (d.file) formData.append("photos", d.file);
        });
        formData.append(
            "documentation_dates",
            JSON.stringify(drafts.map((d) => d.date || "")),
        );

        const response = await sparepartApiClient.post(
            `/api/v1/sparepart/stock/${id}/photos`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return response.data;
    },

    /**
     * Delete photo from sparepart stock
     * DELETE /api/v1/sparepart/stock/{id}/photos/{photo_index}
     */
    deleteSparepartPhoto: async (id: number, photoIndex: number) => {
        const response = await sparepartApiClient.delete(
            `/api/v1/sparepart/stock/${id}/photos/${photoIndex}`,
        );
        return response.data;
    },

    /**
     * Update tools alker.
     *
     * Mirrors `updateSparepartStock`: existing rows are PUTed without photos,
     * new rows are POSTed without photos so we can collect the new stock_id,
     * and finally documentation drafts are uploaded ONCE.
     *
     * PUT /api/v1/sparepart/tools-alker/{id}
     */
    updateToolsAlker: async (id: number, data: SparepartFormData) => {
        const items = data.sparepartStok || [];
        let firstStockId: number | null =
            items.find((i) => i.stockId)?.stockId || null;

        for (const item of items) {
            if (item.stockId) {
                await sparepartApiClient.put(
                    `/api/v1/sparepart/tools-alker/${item.stockId}`,
                    {
                        quantity: Number(item.quantity),
                        notes: data.catatan || undefined,
                    },
                );
                continue;
            }

            const formData = new FormData();
            formData.append("regency", data.kabupaten);
            formData.append("cluster", data.cluster);
            formData.append("region", data.region);
            formData.append("sparepart_id", String(item.id));
            formData.append("quantity", String(item.quantity || 0));
            if (data.catatan) formData.append("notes", data.catatan);
            if (data.pic) formData.append("pic", data.pic);
            if (data.kontak) formData.append("contact", data.kontak);

            const response = await sparepartApiClient.post<ApiResponse<any>>(
                "/api/v1/sparepart/tools-alker",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } },
            );

            const grouped = response.data?.data as any;
            if (
                firstStockId == null &&
                grouped &&
                Array.isArray(grouped.tools)
            ) {
                const target = grouped.tools.find(
                    (t: any) => t.stock_id || t.id,
                );
                if (target) firstStockId = target.stock_id || target.id;
            }
        }

        const drafts = (data.dokumentasiStok || []).filter((d) => !!d.file);
        if (drafts.length > 0 && firstStockId != null) {
            await sparepartApi.addToolsAlkerPhotos(firstStockId, drafts);
        }
        return true;
    },

    /**
     * Add photos to tools alker (mirrors `addSparepartPhotos` semantics).
     * POST /api/v1/sparepart/tools-alker/{id}/photos
     */
    addToolsAlkerPhotos: async (
        id: number,
        photos: File[] | DocumentationDraft[],
    ) => {
        const drafts: DocumentationDraft[] = photos
            .map((p, idx): DocumentationDraft | null => {
                if (p instanceof File) {
                    return { id: `${idx}-${p.name}`, file: p };
                }
                if (p && p.file) return p;
                return null;
            })
            .filter((d): d is DocumentationDraft => d !== null);

        if (drafts.length === 0) return null;

        const formData = new FormData();
        drafts.forEach((d) => {
            if (d.file) formData.append("photos", d.file);
        });
        formData.append(
            "documentation_dates",
            JSON.stringify(drafts.map((d) => d.date || "")),
        );

        const response = await sparepartApiClient.post(
            `/api/v1/sparepart/tools-alker/${id}/photos`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
        );
        return response.data;
    },

    /**
     * Delete photo from tools alker
     * DELETE /api/v1/sparepart/tools-alker/{id}/photos/{photo_index}
     */
    deleteToolsAlkerPhoto: async (id: number, photoIndex: number) => {
        const response = await sparepartApiClient.delete(
            `/api/v1/sparepart/tools-alker/${id}/photos/${photoIndex}`,
        );
        return response.data;
    },

    /**
     * Delete a sparepart stock location group.
     *
     * Frontend rows use `location_id` as their synthetic `id` so the same row
     * can host both NEW_STOCK and USED_STOCK items. The backend endpoint, by
     * contrast, expects the primary key of `sparepart_stock_item`. To bridge
     * the two we expand the row into all of its underlying stock_ids and
     * delete each one. The caller can pass either:
     *   - a full `Sparepart` row (preferred — we use its `sparepart*` items), or
     *   - a list of stockIds, or
     *   - a single stockId (legacy callers).
     *
     * DELETE /api/v1/sparepart/stock/{stock_id}
     */
    deleteSparepartStock: async (input: number | number[] | Sparepart) => {
        const stockIds = resolveSparepartStockIds(input);
        if (stockIds.length === 0) {
            throw new Error("No sparepart stock items to delete");
        }
        await Promise.all(
            stockIds.map((id) =>
                sparepartApiClient.delete(`/api/v1/sparepart/stock/${id}`),
            ),
        );
        return true;
    },

    /**
     * Delete a tools alker location group. Same expansion logic as
     * `deleteSparepartStock`: the synthetic row id is a `location_id`, while
     * the backend expects each `tools_alker_item.id`.
     *
     * DELETE /api/v1/sparepart/tools-alker/{stock_id}
     */
    deleteToolsAlker: async (input: number | number[] | Sparepart) => {
        const stockIds = resolveSparepartStockIds(input);
        if (stockIds.length === 0) {
            throw new Error("No tools alker items to delete");
        }
        await Promise.all(
            stockIds.map((id) =>
                sparepartApiClient.delete(
                    `/api/v1/sparepart/tools-alker/${id}`,
                ),
            ),
        );
        return true;
    },

    /**
     * Export sparepart stock to Excel
     * GET /api/v1/sparepart/stock/export/excel
     */
    exportStockToExcel: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string;
        cluster?: string;
        stock_type?: "stok" | "bekas";
    }) => {
        const response = await sparepartApiClient.get(
            "/api/v1/sparepart/stock/export/excel",
            {
                params,
                responseType: "blob",
            },
        );

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let filename = "sparepart-stock-export.xlsx";
        if (contentDisposition) {
            const filenameMatch =
                contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            filename,
        };
    },

    /**
     * Export sparepart stock to PDF
     * GET /api/v1/sparepart/stock/export/pdf
     */
    exportStockToPDF: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string;
        cluster?: string;
        stock_type?: "stok" | "bekas";
    }) => {
        const response = await sparepartApiClient.get(
            "/api/v1/sparepart/stock/export/pdf",
            {
                params,
                responseType: "blob",
            },
        );

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let filename = "sparepart-stock-export.pdf";
        if (contentDisposition) {
            const filenameMatch =
                contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: new Blob([response.data], {
                type: "application/pdf",
            }),
            filename,
        };
    },

    /**
     * Export tools alker to Excel
     * GET /api/v1/sparepart/tools-alker/export/excel
     */
    exportToolsAlkerToExcel: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string;
        cluster?: string;
    }) => {
        const response = await sparepartApiClient.get(
            "/api/v1/sparepart/tools-alker/export/excel",
            {
                params,
                responseType: "blob",
            },
        );

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let filename = "tools-alker-export.xlsx";
        if (contentDisposition) {
            const filenameMatch =
                contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: new Blob([response.data], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            filename,
        };
    },

    /**
     * Export tools alker to PDF
     * GET /api/v1/sparepart/tools-alker/export/pdf
     */
    exportToolsAlkerToPDF: async (params?: {
        sparepart_name?: string;
        region?: SparepartRegion;
        regency?: string;
        cluster?: string;
    }) => {
        const response = await sparepartApiClient.get(
            "/api/v1/sparepart/tools-alker/export/pdf",
            {
                params,
                responseType: "blob",
            },
        );

        // Extract filename from Content-Disposition header
        const contentDisposition = response.headers["content-disposition"];
        let filename = "tools-alker-export.pdf";
        if (contentDisposition) {
            const filenameMatch =
                contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }

        return {
            blob: new Blob([response.data], {
                type: "application/pdf",
            }),
            filename,
        };
    },

    /**
     * Get all locations
     * GET /api/v1/sparepart/location
     */
    getLocations: async (params?: {
        region?: SparepartRegion;
        regency?: string;
        cluster?: string;
        page?: number;
        limit?: number;
    }) => {
        const backendParams: any = { ...params };
        if (backendParams.region) {
            backendParams.region = backendParams.region.toUpperCase();
        }

        const response = await sparepartApiClient.get<
            ApiResponse<{
                data: Array<{
                    id: number;
                    region: string;
                    regency: string;
                    cluster: string;
                    created_at: string;
                    updated_at: string;
                }>;
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    total_pages: number;
                };
            }>
        >("/api/v1/sparepart/location", { params: backendParams });

        // Backend menggunakan utils.SuccessWithPagination yang mengembalikan:
        // { success: true, message: "...", data: [...locations], pagination: {...} }
        const responseData = response.data as any;
        const locations = Array.isArray(responseData.data)
            ? responseData.data
            : [];
        const pagination = responseData.pagination || {
            page: 1,
            limit: 100,
            total: locations.length,
            total_pages: 1,
        };

        return {
            data: locations,
            pagination: pagination,
        };
    },

    /**
     * Get all contact persons
     * GET /api/v1/sparepart/contact-person
     */
    getContactPersons: async (params?: {
        location_id?: number;
        page?: number;
        limit?: number;
    }) => {
        const response = await sparepartApiClient.get<
            ApiResponse<{
                data: Array<{
                    id: number;
                    location_id: number;
                    pic: string;
                    phone: string;
                    created_at: string;
                    updated_at: string;
                    location: {
                        id: number;
                        region: string;
                        regency: string;
                        cluster: string;
                        created_at: string;
                        updated_at: string;
                    };
                }>;
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    total_pages: number;
                };
            }>
        >("/api/v1/sparepart/contact-person", { params });

        // Handle response structure - bisa berupa { success, data: { data, pagination } } atau { success, data: [...], pagination }
        const responseData = response.data as any;
        const contactPersons = Array.isArray(responseData.data)
            ? responseData.data
            : responseData.data?.data || [];
        const pagination = responseData.pagination ||
            responseData.data?.pagination || {
                page: 1,
                limit: 100,
                total: contactPersons.length,
                total_pages: 1,
            };

        return {
            data: contactPersons,
            pagination: pagination,
        };
    },

    /**
     * Get all sparepart master (list sparepart)
     * GET /api/v1/sparepart/master
     */
    getSparepartMasters: async (params?: {
        item_type?: "SPAREPART" | "TOOLS_ALKER";
        page?: number;
        limit?: number;
    }) => {
        const response = await sparepartApiClient.get<
            ApiResponse<{
                data: Array<{
                    id: number;
                    name: string;
                    item_type: string;
                    created_at: string;
                    updated_at: string;
                }>;
                pagination: {
                    page: number;
                    limit: number;
                    total: number;
                    total_pages: number;
                };
            }>
        >("/api/v1/sparepart/master", { params });

        // Handle response structure - bisa berupa { success, data: { data, pagination } } atau { success, data: [...], pagination }
        const responseData = response.data as any;
        const masters = Array.isArray(responseData.data)
            ? responseData.data
            : responseData.data?.data || [];
        const pagination = responseData.pagination ||
            responseData.data?.pagination || {
                page: 1,
                limit: 100,
                total: masters.length,
                total_pages: 1,
            };

        return {
            data: masters,
            pagination: pagination,
        };
    },
};
