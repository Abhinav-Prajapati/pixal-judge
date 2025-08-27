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

    return (
      <>
        {/* Tab Navigation */}
        <div role="tablist" className="tabs tabs-bordered mb-4">
          <a role="tab" className={`tab ${activeTab === 'grouped' ? 'tab-active' : ''}`} onClick={() => setActiveTab('grouped')}>Grouped View</a>
          <a role="tab" className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`} onClick={() => setActiveTab('all')}>All Images ({allImages.length})</a>
        </div>

        {/* Selection Info Bar - controlled by Zustand state */}
        {isSelectionActive && (
          <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-base-100 shadow">
            <p className="font-semibold">{selectedImages.length} image(s) selected</p>
            <button className="btn btn-sm btn-ghost" onClick={clearSelection}>Clear Selection</button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'grouped' && (
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
        )}

        {activeTab === 'all' && (
          <section className="rounded-lg bg-white/5 p-4">
            <ImageGrid images={allImages} />
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
