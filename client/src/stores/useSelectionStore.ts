import { create } from 'zustand';

interface SelectionState {
  selectedImageIds: Set<number>;
  toggleSelection: (id: number) => void;
  clearSelection: () => void;
  count: () => number;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedImageIds: new Set(),
  
  toggleSelection: (id) => set((state) => {
    const newSet = new Set(state.selectedImageIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return { selectedImageIds: newSet };
  }),

  clearSelection: () => set({ selectedImageIds: new Set() }),
  
  count: () => get().selectedImageIds.size,
}));