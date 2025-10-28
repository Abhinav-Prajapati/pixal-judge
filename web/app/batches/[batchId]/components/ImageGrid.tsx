"use client";

import React from "react";
import type { ImageResponse } from "@/client/types.gen";
import { ImageCard } from "@/components/ui/ImageCard";

export function ImageGrid({
  images,
  onImageClick,
  onImageSelect,
  selectedImageIds,
}: {
  images: ImageResponse[];
  onImageClick: (image: ImageResponse) => void;
  onImageSelect: (image: ImageResponse) => void;
  selectedImageIds: Set<number>;
}) {
  if (!images || images.length === 0) {
    return <p className="text-base-content/60">No images to display.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2 ">
      {images.map((image) => (
        <ImageCard
          key={image.id}
          image={image}
          isSelected={selectedImageIds.has(image.id)}
          onDetailClick={onImageClick}
          onSelectToggle={onImageSelect}
        />
      ))}
    </div>
  );
}