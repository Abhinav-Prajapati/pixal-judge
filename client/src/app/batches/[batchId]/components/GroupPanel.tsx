'use client'
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import type { ImageResponse } from '@/client/types.gen'; // Import the type for clarity

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// No changes needed for this component
function ClusterImage({ image }: { image: ImageResponse; }) {
  return (
    <div className="w-28 h-40 relative overflow-hidden shadow-md bg-base-300 rounded-md">
      <img
        src={`${API_BASE_URL}/images/thumbnail/${image.id}`}
        alt={image.original_filename || `Image ${image.id}`}
        title={image.original_filename}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export function GroupPanel() {
  const params = useParams();
  const batchId = Number(params.batchId);
  const [activeTab, setActiveTab] = useState<'grouped' | 'all'>('grouped');

  const { data: batch, isLoading, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId), // Only run query if batchId is a valid number
  });

  // Memoized calculation for the "Grouped" view
  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];

    const clusters = batch.image_associations.reduce((acc, assoc) => {
      const { image, group_label } = assoc;
      // Use a default key for ungrouped images if needed, or filter them out
      const key = group_label ?? 'Ungrouped';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(image);
      return acc;
    }, {} as Record<string, ImageResponse[]>);

    return Object.entries(clusters);
  }, [batch]);

  // Memoized list for the "All Images" view
  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];
    return batch.image_associations.map(assoc => assoc.image);
  }, [batch]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-error">Error: {error.message}</div>;
    }
    if (!batch || batch.image_associations.length === 0) {
      return <div className="flex items-center justify-center h-full text-base-content/60"><p>No images in this batch.</p></div>;
    }

    return (
      <>
        {/* Tab Navigation */}
        <div role="tablist" className="tabs tabs-bordered mb-4">
          <a
            role="tab"
            className={`tab ${activeTab === 'grouped' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('grouped')}
          >
            Grouped View
          </a>
          <a
            role="tab"
            className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Images ({allImages.length})
          </a>
        </div>

        {/* Tab Content */}
        {activeTab === 'grouped' && (
          <div className="flex flex-row flex-wrap items-start gap-4">
            {clusterEntries.map(([clusterId, images]) => (
              <section key={clusterId} className="rounded-lg bg-white/5 p-3">
                <h2 className="mb-3">
                  Cluster {clusterId}
                  <span className="badge badge-outline badge-info ml-2 rounded-full text-sm">{images.length}</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {images.map(img => <ClusterImage key={img.id} image={img} />)}
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'all' && (
          <section className="rounded-lg bg-white/5 p-3">
            <div className="flex flex-wrap gap-2">
              {allImages.map(img => <ClusterImage key={img.id} image={img} />)}
            </div>
          </section>
        )}
      </>
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