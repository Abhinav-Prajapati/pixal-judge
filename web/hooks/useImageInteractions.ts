import { useCallback } from "react";
import { useImageSelectionStore } from "../stores/useImageSelectionStore";
import { ImageResponse } from "../client/types.gen";

/**
 * Manages all multi-image selection interactions.
 * Detail panel logic is now handled in `useViewStore`.
 */
export function useImageInteractions() {
  const { selectedImageIds, toggleImage } = useImageSelectionStore();

  const handleImageSelect = useCallback(
    (image: ImageResponse) => {
      toggleImage(image.id);
    },
    [toggleImage],
  );

  return {
    selectedImageIds,
    handleImageSelect,
  };
}