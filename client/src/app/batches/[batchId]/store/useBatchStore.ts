import { create } from "zustand";
import { BatchResponse, ClusteringBatchesService, OpenAPI } from "@/api";

OpenAPI.BASE = "http://127.0.0.1:8000";

interface BatchState {
    batch: BatchResponse | null;
    loading: boolean;
    error: string | null;
    fetchBatch: (batchId: number) => Promise<void>;
    clearBatch: () => void;
}

export const useBatchStore = create<BatchState>((set) => ({
    batch: null,
    loading: false,
    error: null,

    fetchBatch: async (batchId: number) => {
        set({ loading: true, error: null });
        try {
            const data = await ClusteringBatchesService.getBatchDetailsBatchesBatchIdGet(batchId);
            console.log(data)
            set({ batch: data, loading: false });
        } catch (err) {
            console.error("Failed to fetch batch", err);
            set({ error: "Failed to load batch", loading: false });
        }
    },

    clearBatch: () => set({ batch: null, error: null }),
}));
