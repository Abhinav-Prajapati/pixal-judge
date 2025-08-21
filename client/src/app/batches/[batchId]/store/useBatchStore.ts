import { create } from "zustand";
import { BatchResponse } from "@/api/models/BatchResponse";
import { ClusteringBatchesService, OpenAPI } from "@/api";

OpenAPI.BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export type ClusterEntry = [string, number[]];

interface BatchState {
    batch: BatchResponse | null;
    loading: boolean;
    error: string | null;
    fetchBatch: (batchId: number) => Promise<void>;
    clearBatch: () => void;
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

    getClusterEntries: () => {
        const batch = get().batch;

        if (!batch?.cluster_summary) {
            return [];
        }

        const clusterMap = batch.cluster_summary.cluster_map as Record<string, number[]>;

        if (!clusterMap || typeof clusterMap !== 'object') {
            return [];
        }
        return Object.entries(clusterMap);
    },
}));