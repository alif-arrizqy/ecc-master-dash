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
} from "../types/sparepart.types";

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
        documentation: string[];
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
        documentation: string[];
        notes?: string;
    }>;
    created_at: string;
    updated_at: string;
}

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
                    const baseURL =
                        import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
                    let fullUrl = doc;
                    if (!doc.startsWith("http")) {
                        fullUrl = `${baseURL.replace(/\/$/, "")}${doc.startsWith("/") ? doc : `/${doc}`}`;
                    }
                    dokumentasiStok.push({
                        id: `${s.stock_id || s.id}-stok-${idx}`,
                        url: fullUrl,
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
                    const baseURL =
                        import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
                    let fullUrl = doc;
                    if (!doc.startsWith("http")) {
                        fullUrl = `${baseURL.replace(/\/$/, "")}${doc.startsWith("/") ? doc : `/${doc}`}`;
                    }
                    dokumentasiBekas.push({
                        id: `${s.stock_id || s.id}-bekas-${idx}`,
                        url: fullUrl,
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
                    const baseURL =
                        import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
                    let fullUrl = doc;
                    if (!doc.startsWith("http")) {
                        fullUrl = `${baseURL.replace(/\/$/, "")}${doc.startsWith("/") ? doc : `/${doc}`}`;
                    }
                    dokumentasiStok.push({
                        id: `${t.stock_id || t.id}-tools-${idx}`,
                        url: fullUrl,
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
    documentation: string[];
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

                // Add documentation
                item.documentation.forEach((doc, idx) => {
                    const baseURL =
                        import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
                    let fullUrl = doc;
                    if (
                        !doc.startsWith("http://") &&
                        !doc.startsWith("https://")
                    ) {
                        const cleanBaseURL = baseURL.replace(/\/$/, "");
                        const cleanImagePath = doc.startsWith("/")
                            ? doc
                            : `/${doc}`;
                        fullUrl = `${cleanBaseURL}${cleanImagePath}`;
                    }
                    dokumentasiStok.push({
                        id: `${item.id}-stok-${idx}`,
                        url: fullUrl,
                    });
                });
            } else {
                sparepartBekas.push(sparepartItem);

                if (!notesBekas && item.notes) notesBekas = item.notes;

                // Add documentation
                item.documentation.forEach((doc, idx) => {
                    const baseURL =
                        import.meta.env.VITE_SPAREPART_SERVICES_URL || "";
                    let fullUrl = doc;
                    if (
                        !doc.startsWith("http://") &&
                        !doc.startsWith("https://")
                    ) {
                        const cleanBaseURL = baseURL.replace(/\/$/, "");
                        const cleanImagePath = doc.startsWith("/")
                            ? doc
                            : `/${doc}`;
                        fullUrl = `${cleanBaseURL}${cleanImagePath}`;
                    }
                    dokumentasiBekas.push({
                        id: `${item.id}-bekas-${idx}`,
                        url: fullUrl,
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
     * Create new sparepart stock
     * POST /api/v1/sparepart/stock
     * Backend expects: location_id, sparepart_id, stock_type (NEW_STOCK/USED_STOCK), quantity, notes, photos[]
     */
    createSparepartStock: async (data: SparepartFormData) => {
        if (!data.location_id) {
            throw new Error("Location ID is required");
        }

        const itemsToCreate = [
            ...(data.sparepartStok || []),
            ...(data.sparepartBekas || []),
        ];

        if (itemsToCreate.length === 0) {
            throw new Error("No sparepart items to create.");
        }

        const results = await Promise.all(
            itemsToCreate.map(async (item) => {
                const formData = new FormData();
                formData.append("location_id", String(data.location_id));
                formData.append("sparepart_id", String(item.id)); // Master ID
                formData.append(
                    "stock_type",
                    item.stock_type === "NEW_STOCK"
                        ? "NEW_STOCK"
                        : "USED_STOCK",
                );
                formData.append("quantity", String(item.quantity || 0));

                if (data.catatan) formData.append("notes", data.catatan);

                // Append photos based on stock type
                const photosForItem =
                    item.stock_type === "NEW_STOCK"
                        ? data.dokumentasiStok || []
                        : data.dokumentasiBekas || [];
                photosForItem.forEach((file) => {
                    formData.append("photos", file);
                });

                return sparepartApiClient.post<ApiResponse<BackendStockItem>>(
                    "/api/v1/sparepart/stock",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );
            }),
        );

        // Return the mapped first item from the results, or handle multiple if needed
        // For simplicity, we'll map all created items and return the first grouped result.
        const mappedData = mapBackendToFrontend(
            results.map((res) => res.data.data),
        );
        return mappedData[0];
    },

    /**
     * Create new tools alker
     * POST /api/v1/sparepart/tools-alker
     */
    createToolsAlker: async (data: SparepartFormData) => {
        const itemsToCreate = data.sparepartStok || [];
        if (itemsToCreate.length === 0) {
            throw new Error("No tools alker items to create.");
        }

        const results = await Promise.all(
            itemsToCreate.map(async (item) => {
                const formData = new FormData();
                formData.append("regency", data.kabupaten);
                formData.append("cluster", data.cluster);
                formData.append("region", data.region);
                formData.append("sparepart_id", String(item.id)); // Master ID
                formData.append("quantity", String(item.quantity || 0));

                if (data.catatan) formData.append("notes", data.catatan);
                if (data.pic) formData.append("pic", data.pic);
                if (data.kontak) formData.append("contact", data.kontak);

                if (data.dokumentasiStok) {
                    data.dokumentasiStok.forEach((file) => {
                        formData.append(`photos`, file);
                    });
                }

                return sparepartApiClient.post<ApiResponse<Sparepart>>(
                    "/api/v1/sparepart/tools-alker",
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    },
                );
            }),
        );

        // Return the mapped first item from the results
        const mappedData = mapBackendToFrontendNew(
            results.map((res) => res.data.data as BackendToolsAlkerItemNew),
            "tools-alker",
        );
        return mappedData[0];
    },

    /**
     * Update sparepart stock
     * PUT /api/v1/sparepart/stock/{id}
     */
    updateSparepartStock: async (id: number, data: SparepartFormData) => {
        const items = [
            ...(data.sparepartStok || []),
            ...(data.sparepartBekas || []),
        ];
        const promises: Promise<any>[] = [];

        for (const item of items) {
            if (item.stockId) {
                // Update existing item
                const payload = {
                    quantity: Number(item.quantity),
                    notes: data.catatan || undefined,
                };
                promises.push(
                    sparepartApiClient.put(
                        `/api/v1/sparepart/stock/${item.stockId}`,
                        payload,
                    ),
                );
            } else {
                // Create new item within this location group
                const formData = new FormData();
                formData.append("location_id", String(id)); // Use the main ID as location_id for new items
                formData.append("sparepart_id", String(item.id)); // Master ID
                formData.append(
                    "stock_type",
                    item.stock_type === "NEW_STOCK"
                        ? "NEW_STOCK"
                        : "USED_STOCK",
                );
                formData.append("quantity", String(item.quantity || 0));
                if (data.catatan) formData.append("notes", data.catatan);

                // Photos for newly created items
                const photosForItem =
                    item.stock_type === "NEW_STOCK"
                        ? data.dokumentasiStok || []
                        : data.dokumentasiBekas || [];
                photosForItem.forEach((file) => {
                    formData.append("photos", file);
                });

                promises.push(
                    sparepartApiClient.post(
                        "/api/v1/sparepart/stock",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        },
                    ),
                );
            }
        }

        // Handle adding new photos to existing stock items
        // We need a stockId to add photos. We'll use the first available stockId of the respective type.
        if (data.dokumentasiStok && data.dokumentasiStok.length > 0) {
            const targetStockId = items.find(
                (i) => i.stockId && i.stock_type === "NEW_STOCK",
            )?.stockId;
            if (targetStockId) {
                promises.push(
                    sparepartApi.addSparepartPhotos(
                        targetStockId,
                        data.dokumentasiStok,
                    ),
                );
            }
        }
        if (data.dokumentasiBekas && data.dokumentasiBekas.length > 0) {
            const targetStockId = items.find(
                (i) => i.stockId && i.stock_type === "USED_STOCK",
            )?.stockId;
            if (targetStockId) {
                promises.push(
                    sparepartApi.addSparepartPhotos(
                        targetStockId,
                        data.dokumentasiBekas,
                    ),
                );
            }
        }

        await Promise.all(promises);
        return true; // Simplified return
    },

    /**
     * Add photos to sparepart stock
     * POST /api/v1/sparepart/stock/{id}/photos
     */
    addSparepartPhotos: async (id: number, photos: File[]) => {
        const formData = new FormData();
        photos.forEach((file) => {
            formData.append("photos", file);
        });

        const response = await sparepartApiClient.post(
            `/api/v1/sparepart/stock/${id}/photos`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
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
     * Update tools alker
     * PUT /api/v1/sparepart/tools-alker/{id}
     */
    updateToolsAlker: async (id: number, data: SparepartFormData) => {
        const items = data.sparepartStok || [];
        const promises: Promise<any>[] = [];

        for (const item of items) {
            if (item.stockId) {
                // Update existing item
                const payload = {
                    quantity: Number(item.quantity),
                    notes: data.catatan || undefined,
                };
                promises.push(
                    sparepartApiClient.put(
                        `/api/v1/sparepart/tools-alker/${item.stockId}`,
                        payload,
                    ),
                );
            } else {
                // Create new item within this location group
                const formData = new FormData();
                formData.append("regency", data.kabupaten);
                formData.append("cluster", data.cluster);
                formData.append("region", data.region);
                formData.append("sparepart_id", String(item.id)); // Master ID
                formData.append("quantity", String(item.quantity || 0));
                if (data.catatan) formData.append("notes", data.catatan);
                if (data.pic) formData.append("pic", data.pic);
                if (data.kontak) formData.append("contact", data.kontak);

                // Photos for newly created items
                if (data.dokumentasiStok) {
                    data.dokumentasiStok.forEach((file) => {
                        formData.append(`photos`, file);
                    });
                }

                promises.push(
                    sparepartApiClient.post(
                        "/api/v1/sparepart/tools-alker",
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        },
                    ),
                );
            }
        }

        // Handle adding new photos to existing tools alker items
        if (data.dokumentasiStok && data.dokumentasiStok.length > 0) {
            const targetStockId = items.find((i) => i.stockId)?.stockId;
            if (targetStockId) {
                promises.push(
                    sparepartApi.addToolsAlkerPhotos(
                        targetStockId,
                        data.dokumentasiStok,
                    ),
                );
            }
        }

        await Promise.all(promises);
        return true;
    },

    /**
     * Add photos to tools alker
     * POST /api/v1/sparepart/tools-alker/{id}/photos
     */
    addToolsAlkerPhotos: async (id: number, photos: File[]) => {
        const formData = new FormData();
        photos.forEach((file) => {
            formData.append("photos", file);
        });

        const response = await sparepartApiClient.post(
            `/api/v1/sparepart/tools-alker/${id}/photos`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            },
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
     * Delete sparepart stock
     * DELETE /api/v1/sparepart/stock/{id}
     */
    deleteSparepartStock: async (id: number) => {
        const response = await sparepartApiClient.delete(
            `/api/v1/sparepart/stock/${id}`,
        );
        return response.data;
    },

    /**
     * Delete tools alker
     * DELETE /api/v1/sparepart/tools-alker/{id}
     */
    deleteToolsAlker: async (id: number) => {
        const response = await sparepartApiClient.delete(
            `/api/v1/sparepart/tools-alker/${id}`,
        );
        return response.data;
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
