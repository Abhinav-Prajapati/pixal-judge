"use client";

import React, { useRef, useState } from "react";
import { useBatchStore } from "../store/useBatchStore";
import { uploadAndAddImagesToBatch } from "@/client/sdk.gen";
import { Loader2, CloudUpload, Grid2X2, ArrowDown01, Upload } from "lucide-react";

// You should define this in a central config file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export function MediaView() {
  const { batch, loading: isBatchLoading, error, setBatch } = useBatchStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    if (!batch?.id) {
      console.error("Cannot upload: No batch is currently selected.");
      return;
    }
    setIsProcessing(true);
    try {
      const response = await uploadAndAddImagesToBatch({
        path: { batch_id: batch.id },
        body: { files: Array.from(files) },
        throwOnError: true
      });
      setBatch(response.data);
    } catch (apiError) {
      console.error("Failed to upload files:", apiError);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const renderContent = () => {
    if (isBatchLoading) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;
    }
    if (error) {
      return <div className="flex items-center justify-center h-full text-error">Error: {error}</div>;
    }

    if (batch?.image_associations && batch.image_associations.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {batch.image_associations.map(({ image }) => (
            <div key={image.id}>
              <div className="aspect-video overflow-hidden rounded-md">
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

    return (
      <div onClick={handleUploadClick} className="flex flex-col items-center justify-center h-full text-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
        <Upload className="h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-400">Drag and drop photos here</p>
        <p className="mt-2 text-xs text-gray-500">or click to browse</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <button onClick={handleUploadClick} disabled={isProcessing || !batch} className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:opacity-50 disabled:cursor-not-allowed">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CloudUpload className="h-4 w-4" /><span>Upload</span></>}
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