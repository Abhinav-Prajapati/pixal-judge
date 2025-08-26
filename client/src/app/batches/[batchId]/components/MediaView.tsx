"use client";
import React, { useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBatchOptions, uploadAndAddImagesToBatchMutation, getBatchQueryKey } from "@/client/@tanstack/react-query.gen";
import { Loader2, CloudUpload, Upload, Grid2X2, ArrowDown01 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

interface MediaViewProps {
  batchId: number | null;
}

export function MediaView({ batchId }: MediaViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    data: batch,
    isLoading: isBatchLoading,
    error: queryError
  } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId! } }),
    enabled: !!batchId,
  });

  // 2. Handle file uploads with useMutation for better state management
  const uploadMutation = useMutation({
    mutationFn: uploadAndAddImagesToBatchMutation().mutationFn,
    onSuccess: (updatedBatch) => {
      // 3. Invalidate the query to refetch data and show new images
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId! } })
      });
    },
    onError: (error) => {
      console.error("Failed to upload files:", error);
    },
  });

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
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md hover:bg-white/10"><Grid2X2 className="h-4 w-4" /></button>
          <button className="p-2 rounded-md hover:bg-white/10"><ArrowDown01 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="flex-1 p-3 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}