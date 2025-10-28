import { useState, useCallback } from "react";
import { useSelectionStore } from "../stores/selectionStore";

import { ImageResponse } from "../client/types.gen";

/**
 * Manages all image click interactions:
 * 1. Opening/closing the detail panel (single image view).
 * 2. Toggling multi-image selection (with Ctrl/Cmd).
 */
export function useImageInteractions() {
  const [selectedImage, setSelectedImage] = useState<ImageResponse | null>(
    null,
  );

  const { selectedImageIds, toggleSelection } = useSelectionStore();

  const handleImageClick = useCallback((image: ImageResponse) => {
    setSelectedImage(image);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const handleImageSelect = useCallback(
    (image: ImageResponse) => {
      toggleSelection(image.id);
    },
    [toggleSelection],
  );

  return {
    selectedImage,
    handleImageClick,
    handleClosePanel,
    selectedImageIds,
    handleImageSelect,
  };
}