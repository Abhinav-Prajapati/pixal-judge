"use client";

import { useState, FormEvent, SyntheticEvent, useRef } from "react";
import toast from 'react-hot-toast';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

import { client } from '@/client/client.gen';
import {
  getAllImagesOptions,
  uploadImagesMutation,
  getAllImagesQueryKey
} from '../client/@tanstack/react-query.gen';
import type { ImageResponse } from "@/client/types.gen";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

const queryClient = new QueryClient();

function Navbar({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="navbar bg-base-100 shadow-lg rounded-box mb-8">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">ImageClustering App</a>
      </div>
      <div className="flex-none">
        <button className="btn btn-primary" onClick={onUploadClick}>
          Upload Image
        </button>
      </div>
    </div>
  );
}

function ImageUploaderModal({ modalId }: { modalId: string }) {
  const [files, setFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation(uploadImagesMutation());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      toast.error('Please select at least one file to upload.');
      return;
    }

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

    uploadMutation.mutate({
      body: { files: Array.from(files) }
    }, {
      onSuccess: (data) => {
        const responseData = data || [];
        const newImages = responseData.filter(img => !img.is_duplicate);
        const duplicateImages = responseData.filter(img => img.is_duplicate);

        if (newImages.length > 0) {
          toast.success(`Successfully uploaded ${newImages.length} new image(s)!`, { id: toastId });
        } else {
          toast.dismiss(toastId);
        }

        duplicateImages.forEach(image => {
          toast(image.message || `Duplicate: ${image.original_filename}`, { icon: '⚠️', duration: 5000 });
        });

        setFiles(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        queryClient.invalidateQueries({ queryKey: getAllImagesQueryKey() });
        (document.getElementById(modalId) as HTMLDialogElement)?.close();
      },
      onError: (error) => {
        console.error("Upload failed:", error);
        toast.error('Upload failed. Please check the console.', { id: toastId });
      }
    });
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
              disabled={uploadMutation.isPending || !files || files.length === 0}
              className="btn btn-primary"
            >
              {uploadMutation.isPending && <span className="loading loading-spinner"></span>}
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
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

// --- GALLERY IMAGE COMPONENT ---
function GalleryImage({ image }: { image: ImageResponse }) {
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
    width: '150px', height: '200px', opacity: 0, backgroundColor: '#e5e7eb'
  });

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const isLandscape = naturalWidth > naturalHeight;
    setContainerStyle({
      width: isLandscape ? '355px' : '112.5px', height: '200px', opacity: 1,
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
        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/eee/ccc?text=Error'; }}
      />
      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-50 p-2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="truncate text-xs font-medium">{image.original_filename}</p>
      </div>
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
function ImageGalleryPage() {
  const uploadModalId = "upload_modal";
  const { data: images = [], isLoading: loading, error } = useQuery(getAllImagesOptions());

  const handleUploadClick = () => {
    (document.getElementById(uploadModalId) as HTMLDialogElement)?.showModal();
  };

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
            <div className="text-xs">Could not connect to the API. Please ensure the backend server is running.</div>
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
            <button className="btn btn-primary" onClick={handleUploadClick}>Get Started</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <ImageUploaderModal modalId={uploadModalId} />
      <main className="container mx-auto p-4 sm:p-8">
        <Navbar onUploadClick={handleUploadClick} />
        {renderContent()}
      </main>
    </>
  );
}

// --- PROVIDER WRAPPER ---
export default function ImageGalleryPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ImageGalleryPage />
    </QueryClientProvider>
  );
}
