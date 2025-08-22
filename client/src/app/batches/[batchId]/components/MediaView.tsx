"use client";

import { usePanelStore } from "../store/useUiStore";
import { useBatchStore } from "../store/useBatchStore";
import { OpenAPI, ClusteringBatchesService } from "@/api"; // Import OpenAPI and the API service
import React, { useRef, useState } from "react";
import {
  CloudUpload,
  Grid2X2,
  ArrowDown01,
  Upload,
  Loader2,
} from "lucide-react";

export function MediaView() {
  // === State from stores ===
  // Assuming the store provides a `setBatch` method to update the state
  const { batch, loading: isBatchLoading, error, setBatch } = useBatchStore();

  // === Local UI State ===
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === NEW: API-driven file processing ===
  const processFiles = async (files: FileList) => {
    // 1. Guard against no batch being selected
    if (!batch || !batch.id) {
      console.error("Cannot upload: No batch is currently selected.");
      // Optionally, show a user-facing error toast here
      return;
    }
    setIsProcessing(true);
    try {
      // 2. Call the new API endpoint with the batch ID and files
      const updatedBatch =
        await ClusteringBatchesService.uploadAndAddToBatchBatchesBatchIdUploadAndAddPost(
          batch.id,
          { files: Array.from(files) }
        );

      // 3. Update the global store with the response from the server
      setBatch(updatedBatch);
    } catch (apiError) {
      console.error("Failed to upload files:", apiError);
      // Optionally, show a user-facing error toast here
    } finally {
      // 4. Reset the loading state
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // === The render logic remains the same, as it's driven by the store state ===
  const renderContent = () => {
    if (isBatchLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-error">
          Error: {error}
        </div>
      );
    }

    if (batch?.images && batch.images.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {batch.images.map((image) => (
            <div className="">

              <div key={image.id} className="aspect-video overflow-hidden">
                <img
                  src={`${OpenAPI.BASE}/images/thumbnail/${image.id}`}
                  alt={`Thumbnail for image ${image.id}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/320x180/27272a/71717a?text=Error";
                  }}
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
    // Otherwise, show the large upload area
    return (
      <div
        onClick={handleUploadClick}
        className="flex flex-col items-center justify-center h-full text-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
      >
        <Upload className="h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-400">
          Drag and drop photos here
        </p>
        <p className="mt-2 text-xs text-gray-500">or click to browse</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hidden file input for handling uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button
          onClick={handleUploadClick}
          disabled={isProcessing || !batch} // Also disable if no batch is selected
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CloudUpload className="h-4 w-4" />
              <span>Upload</span>
            </>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-md hover:bg-white/10">
            <Grid2X2 className="h-4 w-4" />
          </button>
          <button className="p-2 rounded-md hover:bg-white/10">
            <ArrowDown01 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}