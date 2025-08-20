// File: app/batches/[batchId]/page.tsx
"use client";

import toast, { Toaster } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchService } from '../../../services/batchService';
import { useSelectionStore } from '../../../stores/useSelectionStore';

// Import Components
import { ToolPanel } from './components/ToolPanel';
import { ImageGrid } from './components/ImageGrid';
import { AddImagesModal } from './components/AddImagesModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function BatchDetailPage({ params }: { params: { batchId: string } }) {
  const batchId = parseInt(params.batchId, 10);
  const queryClient = useQueryClient();

  // Client state from Zustand
  const { selectedImageIds, toggleSelection, clearSelection, count } = useSelectionStore();
  
  // Server state from TanStack Query
  const { data: batch, isLoading, isError } = useQuery({
    queryKey: ['batch', batchId],
    queryFn: () => batchService.getBatch(batchId),
  });

  // Mutations for updating server state
  const analyzeMutation = useMutation({
    mutationFn: (params: { eps: number, min_samples: number, metric: string }) => 
      batchService.analyzeBatch(batchId, params),
    onSuccess: (updatedBatch) => {
      // For instant UI update without a refetch
      queryClient.setQueryData(['batch', batchId], updatedBatch);
    },
    // onError is handled globally or with toasts
  });

  const removeImagesMutation = useMutation({
    mutationFn: () => batchService.removeImages(batchId, Array.from(selectedImageIds)),
    onSuccess: () => {
      toast.success("Images removed successfully!");
      queryClient.invalidateQueries({ queryKey: ['batch', batchId] });
      clearSelection();
    },
    onError: () => toast.error("Failed to remove images."),
  });

  // --- Render Logic ---
  if (isLoading) {
    return <div className="text-center py-12"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (isError || !batch) {
    return <div role="alert" className="alert alert-error"><span><b>Error:</b> Could not load batch data.</span></div>;
  }
  
  const clusterEntries = Object.entries(batch.cluster_summary?.cluster_map || {});
  const addModalId = "add_images_modal";
  const removeModalId = "remove_confirm_modal";

  return (
    <>
      <Toaster position="bottom-right" />
      <AddImagesModal modalId={addModalId} batch={batch} />
      <ConfirmModal
        modalId={removeModalId}
        title="Confirm Removal"
        message={`Are you sure you want to remove ${count()} image(s)?`}
        onConfirm={() => removeImagesMutation.mutate()}
      />

      <div className="p-6 flex flex-row gap-6">
        <ToolPanel
          batch={batch}
          analyzeMutation={analyzeMutation}
          selectedCount={count()}
          onRemoveSelected={() => (document.getElementById(removeModalId) as HTMLDialogElement)?.showModal()}
          onAddImagesClick={() => (document.getElementById(addModalId) as HTMLDialogElement)?.showModal()}
        />

        <div className='flex-grow'>
          <header className="mb-6">
            <h1 className="text-3xl font-bold">{batch.batch_name}</h1>
            <p className="mt-1 text-base-content/70">Status: {batch.status} | {batch.image_ids.length} Images</p>
          </header>

          <div className={`space-y-8 transition-opacity duration-300 ${analyzeMutation.isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* ... Your cluster rendering logic remains the same, using `ImageGrid` ... */}
            {/* Example for one cluster */}
            {clusterEntries.map(([clusterId, imageIds]) => (
                <section key={clusterId} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                     {/* ... card title ... */}
                    <ImageGrid 
                      imageIds={imageIds as number[]} 
                      selectedIds={selectedImageIds} 
                      onImageSelect={toggleSelection} 
                    />
                  </div>
                </section>
              ))
            }
          </div>
        </div>
      </div>
    </>
  );
}