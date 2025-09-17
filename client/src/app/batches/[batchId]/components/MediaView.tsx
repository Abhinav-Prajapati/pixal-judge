"use client";
import React, { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadAndAddImagesToBatchMutation,
  getBatchQueryKey,
  addImagesToBatchMutation
} from "@/client/@tanstack/react-query.gen";
import { Loader2, CloudUpload, Upload, PlusCircle, LayoutGrid, List } from "lucide-react";
import { ImageGrid } from './SelectableImageGrid';
import { useImageSelectionStore } from '../store/useImageSelectionStore';
import type { BatchResponse } from "@/client/types.gen";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface MediaViewProps {
  batch: BatchResponse | null;
}

export function MediaView({ batch }: MediaViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const { selectedImages, clearSelection } = useImageSelectionStore();

  const uploadMutation = useMutation({
    mutationFn: uploadAndAddImagesToBatchMutation().mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batch!.id } })
      });
    },
    onError: (error) => {
      console.error("Failed to upload files:", error);
    },
  });

  const addImagesToBatch = useMutation({
    ...addImagesToBatchMutation(),
    onSuccess: () => {
      clearSelection();
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ['getBatch', { path: { batch_id: batch!.id } }] });
    },
    onError: (error) => {
      console.error("Failed to add images to batch:", error);
    }
  });

  const handleAddImages = () => {
    if (batch && selectedImages.length > 0) {
      addImagesToBatch.mutate({
        path: { batch_id: batch.id },
        body: {
          image_ids: selectedImages.map(img => img.id)
        }
      });
    }
  };

  const processFiles = async (files: FileList) => {
    if (!batch) {
      console.error("Cannot upload: No batch is currently selected.");
      return;
    }
    uploadMutation.mutate({
      path: { batch_id: batch.id },
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
    if (uploadMutation.error) {
      return (
        <div className="flex items-center justify-center h-full text-error">
          Error: {uploadMutation.error.message}
        </div>
      );
    }

    if (batch?.image_associations && batch.image_associations.length > 0) {
      if (viewMode === 'grid') {
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

      if (viewMode === 'list') {
        return (
          <div className="flex flex-col gap-2">
            {batch.image_associations.map(({ image }) => (
              <div key={image.id} className="flex items-center gap-4 p-2 rounded-md bg-base-300/50">
                <img
                  src={`${API_BASE_URL}/images/thumbnail/${image.id}`}
                  alt={image.original_filename}
                  className="w-12 h-12 object-cover rounded-md"
                  loading="lazy"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{image.original_filename}</span>
                  <span className="text-xs text-primary-content/50">ID: {image.id}</span>
                </div>
              </div>
            ))}
          </div>
        );
      }
    }

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
            disabled={uploadMutation.isPending || !batch}
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
            disabled={!batch}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="h-4 w-4" /><span>Add Images</span>
          </button>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md bg-base-100">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'text-primary' : 'hover:bg-white/10'}`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'text-primary' : 'hover:bg-white/10'}`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}