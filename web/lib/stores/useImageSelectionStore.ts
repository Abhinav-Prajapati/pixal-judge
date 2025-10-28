import { create } from 'zustand';

interface ImageSelectionState {
  selectedImageIds: Set<number>;
  toggleImage: (id: number) => void;
  clearSelection: () => void;
}

export const useImageSelectionStore = create<ImageSelectionState>((set) => ({
  selectedImageIds: new Set<number>(),

  toggleImage: (id: number) => set((state) => {
    const newSelectedIds = new Set(state.selectedImageIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    return { selectedImageIds: newSelectedIds };
  }),

  clearSelection: () => set({ selectedImageIds: new Set<number>() }),
}));

export const useIsImageSelected = (id: number): boolean => {
  return useImageSelectionStore((state) => state.selectedImageIds.has(id));
}

export const useSelectedImageCount = (): number => {
  return useImageSelectionStore((state) => state.selectedImageIds.size);
}

