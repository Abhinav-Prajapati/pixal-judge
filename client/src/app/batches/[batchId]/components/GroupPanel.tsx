'use client'
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function ClusterImage({ imageId }: { imageId: number; }) {
  return (
    <div className="w-28 h-40 relative overflow-hidden shadow-md bg-base-300 rounded-md">
      <img
        src={`${API_BASE_URL}/images/thumbnail/${imageId}`}
        alt={`Image ${imageId}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function GroupPanel() {
  const params = useParams();
  const batchId = Number(params.batchId);

  const { data: batch, isLoading, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId), // Only run query if batchId is a valid number
  });

  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];

    const clusters = batch.image_associations.reduce((acc, assoc) => {
      const { image, group_label } = assoc;
      if (group_label !== null) {
        if (!acc[group_label]) {
          acc[group_label] = [];
        }
        acc[group_label].push(image.id);
      }
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(clusters);
  }, [batch]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-error">Error: {error.message}</div>;
    }
    if (clusterEntries.length === 0) {
      return <div className="flex items-center justify-center h-full text-base-content/60"><p>No clusters to display.</p></div>;
    }

    return (
      <div className="flex flex-row flex-wrap items-start gap-4">
        {clusterEntries.map(([clusterId, imageIds]) => (
          <section key={clusterId} className="rounded-lg bg-white/5 p-3">
            <h2 className="mb-3">
              Cluster {clusterId}
              <span className="badge badge-outline badge-info ml-2 rounded-full text-sm">{imageIds.length} images</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {imageIds.map(id => <ClusterImage key={id} imageId={id} />)}
            </div>
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="card bg-base-300 text-white w-full h-full m-3 shadow-lg flex flex-col">
      <div className="card-body overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}