import { create } from "zustand";
import { BatchResponse, ClusteringBatchesService, OpenAPI } from "@/api";

OpenAPI.BASE = "http://127.0.0.1:8000";

// Define a type for a single cluster entry for easier use in components
export type ClusterEntry = [string, number[]];

interface BatchState {
    batch: BatchResponse | null;
    loading: boolean;
    error: string | null;
    fetchBatch: (batchId: number) => Promise<void>;
    clearBatch: () => void;
    // Selector to get processed cluster data
    getClusterEntries: () => ClusterEntry[];
}

export const useBatchStore = create<BatchState>((set, get) => ({
    batch: null,
    loading: false,
    error: null,

    fetchBatch: async (batchId: number) => {
        set({ loading: true, error: null });
        try {
            const data = await ClusteringBatchesService.getBatchDetailsBatchesBatchIdGet(batchId);
            console.log("Fetched batch data:", data);
            set({ batch: data, loading: false });
        } catch (err) {
            console.error("Failed to fetch batch", err);
            set({ error: "Failed to load batch", loading: false });
        }
    },

    clearBatch: () => set({ batch: null, error: null }),

    // Selector function to process and return the cluster map as entries
    getClusterEntries: () => {
        const batch = get().batch;
        if (!batch || !batch.cluster_summary || !batch.cluster_summary.cluster_map) {
            return [];
        }
        // The cluster_map is an object, so we convert it to an array of [key, value] pairs
        return Object.entries(batch.cluster_summary.cluster_map) as ClusterEntry[];
    },
}));
