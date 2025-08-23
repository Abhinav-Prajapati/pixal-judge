import { create } from "zustand";
import type { BatchResponse, BatchAnalyze } from "@/client/types.gen";
import { getBatch, analyzeBatch } from "@/client/sdk.gen";

export type ClusterEntry = [string, number[]];

interface BatchState {
    batch: BatchResponse | null;
    loading: boolean;
    error: string | null;
    fetchBatch: (batchId: number) => Promise<void>;
    setBatch: (batch: BatchResponse) => void;
    getClusterEntries: () => ClusterEntry[];
    analyzeBatch: (params: BatchAnalyze) => Promise<void>;
}

export const useBatchStore = create<BatchState>((set, get) => ({
    batch: null,
    loading: false,
    error: null,

    fetchBatch: async (batchId) => {
        set({ loading: true, error: null });
        try {
            const response = await getBatch({ path: { batch_id: batchId }, throwOnError: true });
            set({ batch: response.data, loading: false });
        } catch (err) {
            console.error("Failed to fetch batch", err);
            set({ error: "Failed to load batch", loading: false });
        }
    },

    setBatch: (newBatch) => {
        set({ batch: newBatch, error: null });
    },

    getClusterEntries: () => {
        const { batch } = get();
        if (!batch?.image_associations) return [];

        const clusters = batch.image_associations.reduce((acc, assoc) => {
            const { image, group_label } = assoc;
            if (group_label !== null) {
                if (!acc[group_label]) {
                    acc[group_label] = [];
                }
                acc[group_label].push(image.id);
            }
            return acc;
        }, {} as Record<string, number[]>);

        return Object.entries(clusters);
    },

    analyzeBatch: async (params) => {
        const batchId = get().batch?.id;
        if (!batchId) {
            set({ error: "No batch is currently loaded." });
            return;
        }

        set({ loading: true, error: null });
        try {
            const response = await analyzeBatch({
                path: { batch_id: batchId },
                body: params,
                throwOnError: true
            });
            set({ batch: response.data, loading: false });
        } catch (err) {
            console.error("Failed to analyze batch", err);
            set({ error: "Analysis failed. Please try again.", loading: false });
        }
    },
}));