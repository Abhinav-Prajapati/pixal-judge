"use client";

import { usePanelStore } from "../store/useUiStore";
import { useBatchStore } from "../store/useBatchStore";
import { OpenAPI } from "@/api"; // Import OpenAPI to access the base URL
import React, { useRef, useState } from "react";
import { CloudUpload, Grid2X2, ArrowDown01, Upload, Loader2 } from "lucide-react";

export function MediaView() {
  // === State from stores ===
  const { batch, loading: isBatchLoading, error } = useBatchStore();
  const { addMediaItem } = usePanelStore();

  // === State for new local uploads (this part remains the same) ===
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === Handlers for adding new local files via upload (unchanged) ===
  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    for (const file of Array.from(files)) {
      const newItem = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file), // Still need this for local previews
        type: "image",
      };
      addMediaItem(newItem);
    }
    setIsProcessing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // === A new function to clean up the main render logic ===
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

    if (batch?.image_ids && batch.image_ids.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {batch.image_ids.map((id) => (
            <div key={id} className="aspect-video bg-white/5  overflow-hidden">
              <img
                src={`${OpenAPI.BASE}/images/thumbnail/${id}`}
                alt={`Thumbnail for image ${id}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/320x180/27272a/71717a?text=Error';
                }}
              />
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
        <p className="mt-4 text-sm text-gray-400">Drag and drop photos here</p>
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
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32"
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