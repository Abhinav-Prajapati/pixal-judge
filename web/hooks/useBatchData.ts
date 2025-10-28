import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getBatchOptions } from "@/client/@tanstack/react-query.gen";
import type { ImageResponse } from "@/client/types.gen";

/**
 * Fetches and processes all data related to a specific batch.
 */
export function useBatchData() {
  const params = useParams();
  const batchId = Number(params.batchId);

  const {
    data: batch,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  // Memoize the flat list of all images
  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];
    return batch.image_associations.map((assoc) => assoc.image);
  }, [batch]);

  // Memoize the grouped/clustered list of images
  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];

    const clusters = batch.image_associations.reduce(
      (acc, assoc) => {
        const { image, group_label } = assoc;
        const key = group_label ?? "Ungrouped";
        if (!acc[key]) acc[key] = [];
        acc[key].push(image);
        return acc;
      },
      {} as Record<string, ImageResponse[]>,
    );

    // Sort clusters by size (descending)
    const unsortedEntries = Object.entries(clusters);
    unsortedEntries.sort(
      ([, imagesA], [, imagesB]) => imagesB.length - imagesA.length,
    );
    return unsortedEntries;
  }, [batch]);

  return {
    batchId,
    batch,
    allImages,
    clusterEntries,
    isLoading,
    isError,
    error,
  };
}