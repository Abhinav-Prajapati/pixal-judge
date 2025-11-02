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
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <div className="flex flex-col items-center space-y-2 text-neutral-500 dark:text-neutral-400">
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold">No Images</h3>
          <p className="text-sm text-center">This section doesn't contain any images yet.</p>
        </div>
      </div>
    );
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