import { create } from "zustand";

type SelectionState = {
  selectedImageIds: Set<number>;
  toggleSelection: (imageId: number) => void;
  clearSelection: () => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedImageIds: new Set<number>(),

  toggleSelection: (imageId: number) =>
    set((state) => {
      const newSelectedIds = new Set(state.selectedImageIds);

      if (newSelectedIds.has(imageId)) {
        newSelectedIds.delete(imageId);
      } else {
        newSelectedIds.add(imageId);
      }

      return { selectedImageIds: newSelectedIds };
    }),

  clearSelection: () => set({ selectedImageIds: new Set<number>() }),
}));