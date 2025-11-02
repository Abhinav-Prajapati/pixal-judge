import React from "react";
import type { ImageResponse, GroupAssociationResponse } from "@/client/types.gen";
import { useBatchViewStore } from "./useBatchViewStore";
import { NavToolBar } from "./NavToolbar";
import { ImageGrid } from "./ImageGrid";
import { useGroupRanking } from "@/hooks/useGroupRanking";
import { Button } from "@heroui/react";

type ClusterEntry = readonly [string, ImageResponse[], GroupAssociationResponse[]];

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
            onImageClick={onImageClick}
            onImageSelect={onImageSelect}
            selectedImageIds={selectedImageIds}
          />
        )}
        {view === "grouped" && (
          <div className="flex flex-col gap-6">
            {clusterEntries.map(([clusterId, images, associations]) => {
              // Check if group is ranked (any association has quality_rank)
              const isRanked = associations.some(assoc => assoc.quality_rank !== null);

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
                      isLoading={rankingGroup === clusterId}
                      onPress={() => handleRankGroup(clusterId)}
                      radius="none"
                      className="ml-4"
                    >
                      {isRanked ? "Re-rank" : "Rank Images"}
                    </Button>
                  </div>
                  <ImageGrid
                    images={images}
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