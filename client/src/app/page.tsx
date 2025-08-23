/*
  File: app/page.tsx

  This is a Next.js client component that displays an image gallery and
  includes a modal to upload new images with toast notifications.
*/
"use client";

import { useState, useEffect, useCallback, FormEvent, SyntheticEvent, useRef } from "react";
import toast from 'react-hot-toast';

import { client } from '@/client/client.gen';
import { getAllImages } from "@/client/sdk.gen";
import type { ImageResponse } from "@/client/types.gen";

const API_BASE_URL = "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

function ImageUploaderModal({ modalId, onUploadSuccess }: { modalId: string, onUploadSuccess: () => void }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    // NOTE: This part will be migrated next.
    alert("Upload logic needs to be migrated!");
    setIsUploading(false);
    toast.dismiss(toastId);
  };

  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Upload New Images</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.close()}>Cancel</button>
            <button
              type="submit"
              disabled={isUploading || !files || files.length === 0}
              className="btn btn-primary"
            >
              {isUploading && <span className="loading loading-spinner"></span>}
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

function GalleryImage({ image }: { image: ImageResponse }) {
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
    width: '150px',
    height: '200px',
    opacity: 0,
    backgroundColor: '#e5e7eb'
  });

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const isLandscape = naturalWidth > naturalHeight;
    setContainerStyle({
      width: isLandscape ? '355px' : '112.5px',
      height: '200px',
      opacity: 1,
    });
  };

  return (
    <div
      style={containerStyle}
      className="group relative overflow-hidden shadow-lg transition-all duration-500 ease-in-out"
    >
      <img
        src={`${API_BASE_URL}/images/thumbnail/${image.id}`}
        alt={image.original_filename}
        onLoad={handleImageLoad}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/eee/ccc?text=Error';
        }}
      />
      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="truncate text-xs font-medium">{image.original_filename}</p>
      </div>
    </div>
  );
}

export default function ImageGalleryPage() {
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const uploadModalId = "upload_modal";

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllImages();
      setImages(response.data || []);
      setError(null);
    } catch (e) {
      console.error("Failed to fetch images:", e);
      setError("Could not connect to the API. Please ensure the backend server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      );
    }

    if (error) {
      return (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 className="font-bold">An Error Occurred!</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
      );
    }

    if (images.length > 0) {
      return (
        <div className="flex flex-wrap justify-start gap-1">
          {images.map((image) => (
            <GalleryImage key={image.id} image={image} />
          ))}
        </div>
      );
    }

    return (
      <div className="hero min-h-[50vh] bg-base-100 rounded-lg">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">No Images Yet</h1>
            <p className="py-6">Your gallery is empty. Why not upload your first image?</p>
            <button className="btn btn-primary" onClick={() => (document.getElementById(uploadModalId) as HTMLDialogElement)?.showModal()}>Get Started</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ImageUploaderModal modalId={uploadModalId} onUploadSuccess={fetchImages} />
      <div className="container mx-auto p-4 sm:p-8">
        {renderContent()}
      </div>
    </>
  );
}