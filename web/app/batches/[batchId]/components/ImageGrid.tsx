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
      {images.map((image) => {
        const isSelected = selectedImageIds.has(image.id);
        return (
          // Wrap ImageCard in a clickable div
          <div
            key={image.id}
            onClick={(e) => {
              // On Ctrl (Windows/Linux) or Meta (Mac) click, toggle selection
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                onImageSelect(image);
              } else {
                // On a normal click, open the detail panel
                onImageClick(image);
              }
            }}
            className={`cursor-pointer transition-all duration-150 ease-in-out
              ${isSelected
                ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 rounded-md"
                : ""
              }
            `}
          >
            <ImageCard image={image} />
          </div>
        );
      })}
    </div>
  );
}