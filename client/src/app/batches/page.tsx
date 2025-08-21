/*
  File: app/batches/page.tsx
  This is a client component for managing clustering batches. It allows users
  to view existing batches and create new ones via a modal, styled with DaisyUI.
*/
"use client";

import { useState, useEffect, FormEvent, useCallback, useRef } from 'react';
import Link from 'next/link';
import { OpenAPI, ClusteringBatchesService, ImagesService, BatchResponse, ImageResponse } from '../../api';

// Configure the base URL for the API
OpenAPI.BASE = "http://127.0.0.1:8000";

// --- DaisyUI Modal Component for Creating a New Batch ---
function CreateBatchModal({ modalId, onBatchCreated }: { modalId: string; onBatchCreated: () => void; }) {
  const [allImages, setAllImages] = useState<ImageResponse[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Fetch images only when the dialog is actually opened
  useEffect(() => {
    const dialog = dialogRef.current;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'open' && dialog?.open && allImages.length === 0) {
          setIsLoading(true);
          ImagesService.getAllImagesImagesGet()
            .then(setAllImages)
            .catch(() => setError("Failed to load images for selection."))
            .finally(() => setIsLoading(false));
        }
      });
    });
    if (dialog) {
      observer.observe(dialog, { attributes: true });
    }
    return () => observer.disconnect();
  }, [allImages.length]);

  const handleImageSelect = (imageId: number) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const resetState = () => {
    setBatchName('');
    setSelectedImageIds(new Set());
    setError(null);
  };

  const handleClose = () => {
    resetState();
    dialogRef.current?.close();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || selectedImageIds.size === 0) {
      setError("Please provide a batch name and select at least one image.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await ClusteringBatchesService.createBatchBatchesPost({
        name: batchName,
        image_ids: Array.from(selectedImageIds),
      });
      onBatchCreated();
      handleClose();
    } catch (err) {
      setError("Failed to create batch. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog id={modalId} ref={dialogRef} className="modal">
      <div className="modal-box w-11/12 max-w-3xl max-h-[90vh] flex flex-col">
        <h3 className="font-bold text-2xl">Create New Batch</h3>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0 py-4">
          <div className="form-control">
            <input
              type="text"
              placeholder="Enter Batch Name"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="input input-bordered w-full mb-4"
            />
          </div>
          <p className="mb-2 font-semibold">Select Images ({selectedImageIds.size} selected)</p>
          <div className="flex-grow border border-base-300 bg-base-200 rounded-lg p-2 overflow-y-auto">
            {isLoading && <div className="flex justify-center p-4"><span className="loading loading-spinner"></span></div>}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {allImages.map(img => (
                <div key={img.id} onClick={() => handleImageSelect(img.id)} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer ring-offset-base-100 ring-offset-2 ${selectedImageIds.has(img.id) ? 'ring-2 ring-primary' : ''}`}>
                  <img src={`${OpenAPI.BASE}/images/thumbnail/${img.id}`} alt={img.original_filename} className="h-full w-full object-cover" />
                  {selectedImageIds.has(img.id) && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white">✓</div>}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
          <div className="modal-action mt-4">
            <button type="button" onClick={handleClose} className="btn">Cancel</button>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading && <span className="loading loading-spinner"></span>}
              {isLoading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
}

// --- Main Batches Page Component ---
export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const modalId = "create_batch_modal";

  const fetchBatches = useCallback(() => {
    setLoading(true);
    ClusteringBatchesService.getAllBatchesBatchesGet()
      .then(setBatches)
      .catch(e => {
        console.error("Failed to fetch batches:", e);
        setError("Could not connect to the API.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-12"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (error) {
      return (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><h3 className="font-bold">An Error Occurred</h3><div className="text-xs">{error}</div></div>
        </div>
      );
    }

    if (batches.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map(batch => (
            <Link key={batch.id} href={`/batches/${batch.id}`} className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="card-body">
                <h2 className="card-title text-primary">{batch.batch_name}</h2>
                <p className="text-sm text-base-content text-opacity-60 -mt-2">ID: {batch.id}</p>
                <div className="card-actions justify-between items-center mt-4">
                  <div className="text-base-content">{batch.images.length} images</div>
                  <div className={`badge ${batch.status === 'complete' ? 'badge-success' : 'badge-warning'}`}>
                    {batch.status}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-12 hero bg-base-200 rounded-lg">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-3xl font-bold">No Batches Found</h1>
            <p className="py-6">Create your first batch to start analyzing image clusters.</p>
            <button className="btn btn-primary" onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.showModal()}>Get Started</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <CreateBatchModal modalId={modalId} onBatchCreated={fetchBatches} />
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Clustering Batches</h1>
            <p className="mt-2 text-lg text-base-content text-opacity-70">Manage and analyze your image batches.</p>
          </div>
          <button onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.showModal()} className="btn btn-primary">
            Create New Batch
          </button>
        </header>
        {renderContent()}
      </div>
    </>
  );
}