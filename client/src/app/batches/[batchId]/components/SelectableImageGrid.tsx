// src/components/ImageGrid.tsx
'use client';
import { useEffect } from 'react';
import type { ImageResponse } from '@/client/types.gen';
import { useImageSelectionStore } from '../store/useImageSelectionStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function SelectableImage({
  image,
}: {
  image: ImageResponse;
}) {
  const { isSelectionActive, selectedImages, setSelectedImages, setIsSelectionActive } = useImageSelectionStore();

  const isSelected = selectedImages.some(img => img.id === image.id);

  const toggleSelection = () => {
    const newSelected = isSelected
      ? selectedImages.filter(img => img.id !== image.id)
      : [...selectedImages, image];

    setSelectedImages(newSelected);

    if (newSelected.length === 0) {
      setIsSelectionActive(false);
    }
  };

  const startSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelectionActive) {
      setIsSelectionActive(true);
    }
    toggleSelection();
  };

  return (
    <div
      className={`group relative w-28 h-40 rounded-md overflow-hidden shadow-md ${isSelectionActive ? 'cursor-pointer' : 'cursor-default'
        } ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : 'ring-0'}`}
      onClick={isSelectionActive ? toggleSelection : undefined}
    >
      <div
        className={`absolute top-2 left-2 z-10 h-5 w-5 rounded-full bg-white/70 border-2 border-gray-500 flex items-center justify-center transition-opacity duration-200 ${isSelectionActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${isSelected ? 'bg-primary border-primary-focus' : ''}`}
        onClick={startSelection}
      >
        {isSelected && <div className="h-2 w-2 rounded-full bg-white"></div>}
      </div>

      <img
        src={`${API_BASE_URL}/images/thumbnail/${image.id}`}
        alt={image.original_filename || `Image ${image.id}`}
        title={image.original_filename}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      {isSelected && <div className="absolute inset-0 bg-primary/30"></div>}
    </div>
  );
}

export function ImageGrid({
  images,
}: {
  images: ImageResponse[];
}) {
  const { clearSelection } = useImageSelectionStore();

  useEffect(() => {
    // This effect can be removed as the logic is now handled in the parent component and the store
  }, [clearSelection]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {images.map(img => (
        <SelectableImage
          key={img.id}
          image={img}
        />
      ))}
    </div>
  );
}