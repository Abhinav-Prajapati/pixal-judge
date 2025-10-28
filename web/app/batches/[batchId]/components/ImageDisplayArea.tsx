"use client";

import React from "react";
import type { ImageResponse } from "@/client/types.gen";
import { useBatchViewStore } from "./useBatchViewStore";
import { NavToolBar } from "./NavToolbar";
import { ImageGrid } from "./ImageGrid";

type ClusterEntry = [string, ImageResponse[]];

export function ImageDisplayArea({
  allImages,
  clusterEntries,
  onImageClick,
  onImageSelect,
  selectedImageIds,
}: {
  allImages: ImageResponse[];
  clusterEntries: ClusterEntry[];
  onImageClick: (image: ImageResponse) => void;
  onImageSelect: (image: ImageResponse) => void;
  selectedImageIds: Set<number>;
}) {
  const { view } = useBatchViewStore();

  return (
    <div className="flex flex-col flex-grow min-w-0">
      {/* View Switcher Nav */}
      <NavToolBar allImagesCount={allImages.length} />

      {/* Page Content Area */}
      <div className="flex-grow p-4">
        {view === "all" && (
          <ImageGrid
            images={allImages}
            onImageClick={onImageClick}
            onImageSelect={onImageSelect}
            selectedImageIds={selectedImageIds}
          />
        )}
        {view === "grouped" && (
          <div className="flex flex-col gap-6">
            {clusterEntries.map(([clusterId, images]) => (
              <section key={clusterId}>
                <h2 className="mb-3 text-lg font-bold">
                  {clusterId}
                  <span className="ml-2 text-sm font-normal text-default-500">
                    ({images.length})
                  </span>
                </h2>
                <ImageGrid
                  images={images}
                  onImageClick={onImageClick}
                  onImageSelect={onImageSelect}
                  selectedImageIds={selectedImageIds}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}