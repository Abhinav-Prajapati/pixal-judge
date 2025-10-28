import { create } from "zustand";

type SelectionState = {
  /**
   * A Set of image IDs that are currently selected.
   */
  selectedImageIds: Set<number>;

  /**
   * Toggles the selection state for a single image ID.
   */
  toggleSelection: (imageId: number) => void;

  /**
   * Clears the entire selection, deselecting all images.
   */
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