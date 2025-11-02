import type {
  ImageResponse,
  GroupAssociationResponse,
} from "@/client/types.gen";

import React from "react";
import { Button } from "@heroui/react";

import { useBatchViewStore } from "./useBatchViewStore";
import { NavToolBar } from "./NavToolbar";
import { ImageGrid } from "./ImageGrid";

import { useGroupRanking } from "@/hooks/useGroupRanking";

type ClusterEntry = readonly [
  string,
  ImageResponse[],
  GroupAssociationResponse[],
];

export function ImageDisplayArea({
  allImages,
  clusterEntries,
  onImageClick,
  onImageSelect,
  selectedImageIds,
  batchId,
  onRankComplete,
}: {
  allImages: ImageResponse[];
  clusterEntries: ClusterEntry[];
  onImageClick: (image: ImageResponse) => void;
  onImageSelect: (image: ImageResponse) => void;
  selectedImageIds: Set<number>;
  batchId: number;
  onRankComplete: () => void;
}) {
  const { view } = useBatchViewStore();
  const { rankGroup, rankingGroup } = useGroupRanking();

  const handleRankGroup = async (groupLabel: string) => {
    try {
      await rankGroup(batchId, groupLabel);
      await onRankComplete(); // Refetch batch data to get updated rankings
    } catch (error) {
      console.error("Failed to rank group:", error);
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
            selectedImageIds={selectedImageIds}
            onImageClick={onImageClick}
            onImageSelect={onImageSelect}
          />
        )}
        {view === "grouped" && (
          <div className="flex flex-col gap-6">
            {clusterEntries.map(([clusterId, images, associations]) => {
              // Check if group is ranked (any association has quality_rank)
              const isRanked = associations.some(
                (assoc) => assoc.quality_rank !== null,
              );

              return (
                <section key={clusterId}>
                  <div className="flex items-center justify-left mb-3">
                    <h2 className="text-lg font-bold">
                      {clusterId}
                      <span className="ml-2 text-sm font-normal text-default-500">
                        ({images.length})
                      </span>
                      {isRanked && (
                        <span className="ml-2 text-xs text-success">
                          ★ Ranked
                        </span>
                      )}
                    </h2>
                    <Button
                      className="ml-4"
                      color={isRanked ? "success" : "primary"}
                      isLoading={rankingGroup === clusterId}
                      radius="none"
                      size="sm"
                      variant="flat"
                      onPress={() => handleRankGroup(clusterId)}
                    >
                      {isRanked ? "Re-rank" : "Rank Images"}
                    </Button>
                  </div>
                  <ImageGrid
                    images={images}
                    selectedImageIds={selectedImageIds}
                    onImageClick={onImageClick}
                    onImageSelect={onImageSelect}
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
