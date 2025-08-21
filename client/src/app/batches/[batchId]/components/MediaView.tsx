"use client"
import { usePanelStore } from "../store/useUiStore";
import React, { useRef, useState } from "react";
import { CloudUpload, Grid2X2, ArrowDown01, Upload } from "lucide-react";

export function MediaView() {
  const { mediaItems, addMediaItem } = usePanelStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    setIsProcessing(true);
    for (const file of files) {
      const newItem = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("image") ? "image" : "video",
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

  return (
    <div className="h-full flex flex-col">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*,video/*"
        onChange={handleFileChange}
      />

      {/* Top Controls Bar */}
      <div className="flex items-center justify-between p-3 border-white/10">
        <button
          onClick={handleUploadClick}
          disabled={isProcessing}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-full"
        >
          <CloudUpload className="h-4 w-4" />
          <span>Upload</span>
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
      <div className="flex-1 p-3 overflow-y-auto">
        {mediaItems.length > 0 ? (
          // Media Grid
          <div className="grid grid-cols-3 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="aspect-square bg-white/5 rounded">
                {item.type === "image" ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover rounded" />
                )}
                <p className="text-xs truncate p-1">{item.name}</p>
              </div>
            ))}
          </div>
        ) : (
          // Empty State / Drag and Drop Overlay
          <div
            onClick={handleUploadClick}
            className="flex flex-col items-center justify-center h-40 text-center rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Upload className="h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-400">
              Drag and drop photos here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}