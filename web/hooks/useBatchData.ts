import type {
  ImageResponse,
  GroupAssociationResponse,
} from "@/client/types.gen";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { getBatchOptions } from "@/client/@tanstack/react-query.gen";

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
    refetch,
  } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  // Memoize the flat list of all images
  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];

    return batch.image_associations.map((assoc) => assoc.image);
  }, [batch]);

  // Memoize the grouped/clustered list with association data
  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];

    const clusters = batch.image_associations.reduce(
      (acc, assoc) => {
        const key = assoc.group_label ?? "Ungrouped";

        if (!acc[key]) acc[key] = { images: [], associations: [] };
        acc[key].images.push(assoc.image);
        acc[key].associations.push(assoc);

        return acc;
      },
      {} as Record<
        string,
        { images: ImageResponse[]; associations: GroupAssociationResponse[] }
      >,
    );

    // Sort clusters by size (descending)
    const unsortedEntries = Object.entries(clusters);

    unsortedEntries.sort(([, a], [, b]) => b.images.length - a.images.length);

    // Convert to simple format for compatibility
    return unsortedEntries.map(
      ([label, data]) => [label, data.images, data.associations] as const,
    );
  }, [batch]);

  return {
    batchId,
    batch,
    allImages,
    clusterEntries,
    isLoading,
    isError,
    error,
    refetch,
  };
}
