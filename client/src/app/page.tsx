/*
  File: app/page.tsx

  This is a Next.js client component that displays an image gallery and
  includes a form to upload new images with toast notifications.
*/
"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { OpenAPI, ImagesService, ImageResponse } from "@/api";
import toast, { Toaster } from 'react-hot-toast';

// IMPORTANT: Configure the base URL of your running FastAPI backend.
OpenAPI.BASE = "http://127.0.0.1:8000";


// A dedicated component for handling file uploads with toast notifications
function ImageUploader({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast.error('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    try {
      const response = await ImagesService.uploadImagesImagesUploadPost({
        files: Array.from(files),
      });

      const newImages = response.filter(img => !img.is_duplicate);
      const duplicateImages = response.filter(img => img.is_duplicate);

      // 1. Update the loading toast ONLY for new images, or dismiss it
      if (newImages.length > 0) {
        toast.success(`Successfully uploaded ${newImages.length} new image(s)!`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }

      // 2. Show a NEW, separate toast for each duplicate found
      duplicateImages.forEach(image => {
        toast(image.message || `Duplicate: ${image.original_filename}`, {
          icon: '⚠️',
          duration: 5000
        });
      });

      setFiles(null);
      (document.getElementById('file-input') as HTMLInputElement).value = '';

      onUploadSuccess();

    } catch (error) {
      console.error("Upload failed:", error);
      toast.error('Upload failed. Please check the console.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload New Images</h2>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            disabled={isUploading || !files || files.length === 0}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </div>
  );
}


export default function ImageGalleryPage() {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(() => {
    setLoading(true);
    ImagesService.getAllImagesImagesGet()
      .then(data => {
        setImages(data);
      })
      .catch(e => {
        console.error("Failed to fetch images:", e);
        setError("Could not connect to the API. Please ensure the backend server is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* UPDATE: Changed toast position to bottom-right */}
      <Toaster position="bottom-right" reverseOrder={false} />
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Image Gallery
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            View and upload images to the database.
          </p>
        </header>

        <ImageUploader onUploadSuccess={fetchImages} />

        {loading ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">Loading images...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
            <p className="font-bold">An Error Occurred</p>
            <p>{error}</p>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105">
                <img
                  src={`${OpenAPI.BASE}/images/thumbnail/${image.id}`}
                  alt={image.original_filename}
                  className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/eee/ccc?text=Error';
                  }}
                />
                <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="truncate text-xs font-medium">{image.original_filename}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500">No images found. Try uploading some!</p>
          </div>
        )}
      </div>
    </main>
  );
}