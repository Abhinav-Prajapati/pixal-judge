// src/store/useImageSelectionStore.ts
import { create } from "zustand";
import type { ImageResponse } from '@/client/types.gen';

interface ImageSelectionStore {
  selectedImages: ImageResponse[];
  isSelectionActive: boolean;

  setSelectedImages: (images: ImageResponse[]) => void;
  setIsSelectionActive: (isActive: boolean) => void;
  clearSelection: () => void;
}

export const useImageSelectionStore = create<ImageSelectionStore>((set) => ({
  selectedImages: [],
  isSelectionActive: false,

  setSelectedImages: (images) => set({ selectedImages: images }),
  setIsSelectionActive: (isActive) => set({ isSelectionActive: isActive }),
  clearSelection: () => set({ selectedImages: [], isSelectionActive: false }),
}));