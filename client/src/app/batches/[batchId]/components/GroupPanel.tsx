'use client'
import { useMemo, useState } from 'react';
import type { BatchResponse, ImageResponse } from '@/client/types.gen';
import { ImageGrid } from './SelectableImageGrid';
import { useImageSelectionStore } from '../store/useImageSelectionStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeImagesFromBatchMutation } from '@/client/@tanstack/react-query.gen';

interface GroupPanelProps {
  batch: BatchResponse;
}

export function GroupPanel({ batch }: GroupPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'grouped' | 'all'>('grouped');
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const {
    selectedImages,
    isSelectionActive,
    clearSelection
  } = useImageSelectionStore();

  const removeImagesMutation = useMutation({
    ...removeImagesFromBatchMutation(),
    onSuccess: () => {
      clearSelection();
      setShowRemoveModal(false);
      queryClient.invalidateQueries({ queryKey: ['getBatch', { path: { batch_id: batch.id } }] });
    },
    onError: (err) => {
      console.error("Failed to remove images from batch:", err);
      setShowRemoveModal(false);
    }
  });

  const handleRemoveImages = () => {
    if (selectedImages.length > 0) {
      removeImagesMutation.mutate({
        path: { batch_id: batch.id },
        body: {
          image_ids: selectedImages.map(img => img.id)
        }
      });
    }
  };

  const clusterEntries = useMemo(() => {
    // Optional chaining here is good practice
    if (!batch?.image_associations) return [];
    const clusters = batch.image_associations.reduce((acc, assoc) => {
      const { image, group_label } = assoc;
      const key = group_label ?? 'Ungrouped';
      if (!acc[key]) acc[key] = [];
      acc[key].push(image);
      return acc;
    }, {} as Record<string, ImageResponse[]>);

    const unsortedEntries = Object.entries(clusters);
    unsortedEntries.sort(([, imagesA], [, imagesB]) => imagesB.length - imagesA.length);
    return unsortedEntries;
  }, [batch]);

  const allImages = useMemo(() => {
    // Optional chaining here is good practice
    if (!batch?.image_associations) return [];
    return batch.image_associations.map(assoc => assoc.image);
  }, [batch]);

  const renderContent = () => {
    // FIX: Add optional chaining to safely access 'length'
    if (!batch || !batch.image_associations?.length) {
      return (
        <div className="flex items-center justify-center h-full text-base-content/60">
          <p>No images in this batch.</p>
        </div>
      );
    }

    const content = activeTab === 'grouped' ? (
      <div className="flex flex-row flex-wrap items-start gap-6">
        {clusterEntries.map(([clusterId, images]) => (
          <section key={clusterId} className="rounded-lg bg-white/5 p-4">
            <h2 className="mb-3 text-lg font-bold">
              {clusterId}
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
        <div className="sticky top-0 z-10 flex items-end justify-between">
          <div className="flex">
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

          {isSelectionActive && (
            <div className="flex items-center rounded-t-lg bg-base-200 px-3 py-2">
              <p className="font-semibold text-sm mr-4">{selectedImages.length} image(s) selected</p>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-dash btn-error"
                  onClick={() => setShowRemoveModal(true)}
                  disabled={removeImagesMutation.isPending}
                >
                  {removeImagesMutation.isPending ? 'Removing...' : 'Remove'}
                </button>
                <button className="btn btn-sm btn-dash btn-primary" onClick={clearSelection}>Clear Selection</button>
              </div>
            </div>
          )}
        </div>
        <div className="flex-grow p-4 bg-base-200 rounded-b-lg shadow-inner overflow-y-auto">
          {content}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col">
      {renderContent()}
      {showRemoveModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Removal</h3>
            <p className="py-4">
              Are you sure you want to remove the selected {selectedImages.length} image(s) from this batch?
              <br />
              <strong className="text-warning">This will not permanently delete the images from your album.</strong>
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowRemoveModal(false)}>Cancel</button>
              <button className="btn btn-error" onClick={handleRemoveImages}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}