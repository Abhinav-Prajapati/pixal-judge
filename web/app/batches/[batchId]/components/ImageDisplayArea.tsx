"use client";

import React, { useState } from "react";
import type { ImageResponse } from "@/client/types.gen";
import { useBatchViewStore } from "./useBatchViewStore";
import { NavToolBar } from "./NavToolbar";
import { ImageGrid } from "./ImageGrid";
import { useImageQuality } from "@/hooks/useImageQuality";
import { Button } from "@heroui/react";

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
  const { analyzeQuality } = useImageQuality();
  const [sortedGroups, setSortedGroups] = useState<Map<string, ImageResponse[]>>(new Map());
  const [analyzingGroup, setAnalyzingGroup] = useState<string | null>(null);

  const rankGroup = async (clusterId: string, images: ImageResponse[]) => {
    setAnalyzingGroup(clusterId);
    try {
      const imageIds = images.map(img => img.id);
      const results = await analyzeQuality(imageIds);

      const sorted = [...images].sort((a, b) => {
        const scoreA = results.find(r => r.image_id === a.id)?.quality_score ?? 0;
        const scoreB = results.find(r => r.image_id === b.id)?.quality_score ?? 0;
        return scoreB - scoreA;
      });

      setSortedGroups(prev => new Map(prev).set(clusterId, sorted));
    } finally {
      setAnalyzingGroup(null);
    }
  };

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
            {clusterEntries.map(([clusterId, images]) => {
              const sortedImages = sortedGroups.get(clusterId) || images;
              const isRanked = sortedGroups.has(clusterId);

              return (
                <section key={clusterId}>
                  <div className="flex items-center justify-left mb-3">
                    <h2 className="text-lg font-bold">
                      {clusterId}
                      <span className="ml-2 text-sm font-normal text-default-500">
                        ({images.length})
                      </span>
                      {isRanked && (
                        <span className="ml-2 text-xs text-success">★ Ranked</span>
                      )}
                    </h2>
                    <Button
                      size="sm"
                      variant="flat"
                      color={isRanked ? "success" : "primary"}
                      isLoading={analyzingGroup === clusterId}
                      onPress={() => rankGroup(clusterId, images)}
                      radius="none"
                      className="ml-4"
                    >
                      {isRanked ? "Re-rank" : "Rank Images"}
                    </Button>
                  </div>
                  <ImageGrid
                    images={sortedImages}
                    onImageClick={onImageClick}
                    onImageSelect={onImageSelect}
                    selectedImageIds={selectedImageIds}
                  />
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}