// src/components/GroupPanel.tsx
'use client'
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import type { ImageResponse } from '@/client/types.gen';
import { ImageGrid } from './SelectableImageGrid';
import { useImageSelectionStore } from '../store/useImageSelectionStore';

export function GroupPanel() {
  const params = useParams();
  const batchId = Number(params.batchId);

  // --- Component State ---
  const [activeTab, setActiveTab] = useState<'grouped' | 'all'>('grouped');

  // --- Zustand State Hook ---
  const {
    selectedImages,
    isSelectionActive,
    clearSelection
  } = useImageSelectionStore();

  // --- Data Fetching ---
  const { data: batch, isLoading, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  // --- Memoized Data Transformation ---
  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];
    const clusters = batch.image_associations.reduce((acc, assoc) => {
      const { image, group_label } = assoc;
      const key = group_label ?? 'Ungrouped';
      if (!acc[key]) acc[key] = [];
      acc[key].push(image);
      return acc;
    }, {} as Record<string, ImageResponse[]>);
    return Object.entries(clusters);
  }, [batch]);

  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];
    return batch.image_associations.map(assoc => assoc.image);
  }, [batch]);

  // --- Render Logic ---
  const renderContent = () => {
    if (isLoading) return <div className="flex items-center justify-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    if (error) return <div className="flex items-center justify-center h-full text-error">Error: {error.message}</div>;
    if (!batch || batch.image_associations.length === 0) return <div className="flex items-center justify-center h-full text-base-content/60"><p>No images in this batch.</p></div>;

    const content = activeTab === 'grouped' ? (
      <div className="flex flex-col items-start gap-6">
        {clusterEntries.map(([clusterId, images]) => (
          <section key={clusterId} className="w-full rounded-lg bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-bold">
              Cluster {clusterId}
              <span className="badge badge-outline badge-info ml-2">{images.length}</span>
            </h2>
            <ImageGrid images={images} />
          </section>
        ))}
      </div>
    ) : (
      <section className="rounded-lg bg-white/5 p-4">
        <ImageGrid images={allImages} />
      </section>
    );

    return (
      <div className="flex flex-col h-full w-full">
        {/* Tab Navigation */}
        <div className="z-10 flex items-end">
          <a
            className={`tab-item px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'grouped'
              ? 'bg-base-200 text-base-content'
              : 'bg-base-300 text-base-content/60 hover:bg-base-200/50'
              }`}
            onClick={() => setActiveTab('grouped')}
          >
            Grouped View
          </a>
          <a
            className={`tab-item px-4 py-2 rounded-t-lg font-medium transition-colors ${activeTab === 'all'
              ? 'bg-base-200 text-base-content'
              : 'bg-base-300 text-base-content/60 hover:bg-base-200/50'
              }`}
            onClick={() => setActiveTab('all')}
          >
            All Images ({allImages.length})
          </a>
        </div>

        {/* Tab Content Container */}
        <div className="flex-grow p-4 bg-base-200 rounded-b-lg shadow-inner overflow-y-auto">
          {isSelectionActive && (
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-base-100 shadow">
              <p className="font-semibold">{selectedImages.length} image(s) selected</p>
              <button className="btn btn-sm btn-ghost" onClick={clearSelection}>Clear Selection</button>
            </div>
          )}
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {renderContent()}
    </div>
  );
}
