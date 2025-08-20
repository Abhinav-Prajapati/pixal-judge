// File: app/batches/[batchId]/components/AddImagesModal.tsx
"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchService } from '@/services/batchService';
import toast from 'react-hot-toast';
import { BatchResponse } from '@/api';
import { SelectableImage } from './SelectableImage';

export function AddImagesModal({ modalId, batch }: { modalId: string, batch: BatchResponse }) {
  const queryClient = useQueryClient();
  const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());

  // Fetch all images to determine which ones are available to be added
  const { data: allImages, isLoading } = useQuery({
    queryKey: ['allImages'],
    queryFn: batchService.getAllImages,
  });

  // Mutation to handle adding the selected images to the batch
  const addImagesMutation = useMutation({
    mutationFn: (imageIds: number[]) => batchService.addImages(batch.id, imageIds),
    onSuccess: () => {
      toast.success("Images added successfully!");
      // Invalidate the query for this specific batch to trigger a refetch on the main page
      queryClient.invalidateQueries({ queryKey: ['batch', batch.id] });
      (document.getElementById(modalId) as HTMLDialogElement)?.close();
      setSelectedToAdd(new Set()); // Clear selection after adding
    },
    onError: () => toast.error("Failed to add images."),
  });

  // Filter out images that are already in the batch
  const currentIds = new Set(batch.image_ids);
  const availableImages = allImages?.filter(img => !currentIds.has(img.id)) || [];

  // Handler to toggle an image's selection state
  const handleToggleSelection = (imageId: number) => {
    setSelectedToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };
  
  // Handler for the primary action button
  const handleAddSelected = () => {
    if (selectedToAdd.size > 0 && !addImagesMutation.isPending) {
      addImagesMutation.mutate(Array.from(selectedToAdd));
    }
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box w-11/12 max-w-6xl h-[80vh] flex flex-col">
        <h3 className="font-bold text-xl flex-shrink-0">Add Images to Batch</h3>
        
        {/* Scrollable container for the images */}
        <div className="flex-grow overflow-y-auto bg-base-200 rounded-lg p-4 my-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableImages.map(img => (
                <SelectableImage 
                  key={img.id} 
                  imageId={img.id} 
                  isSelected={selectedToAdd.has(img.id)} 
                  onSelect={() => handleToggleSelection(img.id)} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal actions footer */}
        <div className="modal-action mt-2 flex justify-between items-center">
          <p className="text-base-content/70">{selectedToAdd.size} image(s) selected</p>
          <div>
            <button type="button" onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.close()} className="btn mr-2">Cancel</button>
            <button 
              type="button" 
              onClick={handleAddSelected} 
              disabled={selectedToAdd.size === 0 || addImagesMutation.isPending} 
              className="btn btn-primary"
            >
              {addImagesMutation.isPending && <span className="loading loading-spinner"></span>}
              Add Selected
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}