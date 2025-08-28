"use client";
import React, { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBatchOptions,
  uploadAndAddImagesToBatchMutation,
  getBatchQueryKey,
  getAllImagesOptions,
  addImagesToBatchMutation
} from "@/client/@tanstack/react-query.gen";
import { Loader2, CloudUpload, Upload, Grid2X2, ArrowDown01, PlusCircle } from "lucide-react";
import { ImageGrid } from './SelectableImageGrid';
import { useImageSelectionStore } from "../store/useImageSelectionStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface MediaViewProps {
  batchId: number | null;
}

export function MediaView({ batchId }: MediaViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Component state for the add images modal
  const [showAddModal, setShowAddModal] = useState(false);

  // Zustand state for image selection in the modal
  const {
    selectedImages,
    isSelectionActive,
    clearSelection
  } = useImageSelectionStore();

  // Query to get all images from the server for the modal
  const { data: allImagesData, isLoading: isAllImagesLoading } = useQuery({
    ...getAllImagesOptions(),
    enabled: showAddModal, // Only fetch when the modal is open
  });

  const {
    data: batch,
    isLoading: isBatchLoading,
    error: queryError
  } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId! } }),
    enabled: !!batchId,
  });

  // Handle file uploads with useMutation for better state management
  const uploadMutation = useMutation({
    mutationFn: uploadAndAddImagesToBatchMutation().mutationFn,
    onSuccess: (updatedBatch) => {
      // Invalidate the query to refetch data and show new images
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId! } })
      });
    },
    onError: (error) => {
      console.error("Failed to upload files:", error);
    },
  });

  // Mutation to add selected images to the current batch
  const addImagesToBatch = useMutation({
    ...addImagesToBatchMutation(),
    onSuccess: () => {
      clearSelection();
      setShowAddModal(false);
      // Invalidate the batch query to show the newly added images
      queryClient.invalidateQueries(getBatchOptions({ path: { batch_id: batchId! } }));
    },
    onError: (error) => {
      console.error("Failed to add images to batch:", error);
    }
  });

  const handleAddImages = () => {
    if (batchId && selectedImages.length > 0) {
      addImagesToBatch.mutate({
        path: { batch_id: batchId },
        body: {
          image_ids: selectedImages.map(img => img.id)
        }
      });
    }
  };

  const processFiles = async (files: FileList) => {
    if (!batchId) {
      console.error("Cannot upload: No batch is currently selected.");
      return;
    }
    uploadMutation.mutate({
      path: { batch_id: batchId },
      body: { files: Array.from(files) },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const renderContent = () => {
    if (isBatchLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    const error = queryError || uploadMutation.error;
    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-error">
          Error: {error.message}
        </div>
      );
    }

    // If a batch is loaded and has images, display them directly here
    if (batch?.image_associations && batch.image_associations.length > 0) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {batch.image_associations.map(({ image }) => (
            <div key={image.id}>
              <div className="aspect-square overflow-hidden rounded-md">
                <img
                  src={`${API_BASE_URL}/images/thumbnail/${image.id}`}
                  alt={image.original_filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="text-primary-content/50 py-1 text-xs truncate">
                {image.original_filename}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default empty/upload state
    return (
      <div
        onClick={handleUploadClick}
        className="flex flex-col items-center justify-center h-full text-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Upload className="h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-400">Drag and drop photos here</p>
        <p className="mt-2 text-xs text-gray-500">or click to browse</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploadMutation.isPending}
      />
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex gap-2">
          <button
            onClick={handleUploadClick}
            disabled={uploadMutation.isPending || !batchId}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><CloudUpload className="h-4 w-4" /><span>Upload</span></>
            )}
          </button>
          <button
            onClick={() => {
              clearSelection();
              setShowAddModal(true);
            }}
            disabled={!batchId}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="h-4 w-4" /><span>Add Images</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md hover:bg-white/10"><Grid2X2 className="h-4 w-4" /></button>
          <button className="p-2 rounded-md hover:bg-white/10"><ArrowDown01 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">{renderContent()}</div>

      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl h-5/6">
            <h3 className="font-bold text-lg">Select Images to Add</h3>
            <div className="py-4 h-full flex flex-col">
              {isAllImagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto p-4">
                  {allImagesData && allImagesData.length > 0 ? (
                    <ImageGrid images={allImagesData} />
                  ) : (
                    <p>No images found on the server.</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => {
                setShowAddModal(false);
                clearSelection();
              }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleAddImages}
                disabled={selectedImages.length === 0 || addImagesToBatch.isPending}
              >
                {addImagesToBatch.isPending ? 'Adding...' : `Add ${selectedImages.length} Image(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
