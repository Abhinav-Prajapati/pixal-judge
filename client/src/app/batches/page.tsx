"use client";
import { Button, ButtonGroup } from "@heroui/button";
import { useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

import { client } from '@/client/client.gen';
import {
  getAllBatchesOptions,
  createBatchMutation,
  getAllImagesOptions,
  getAllBatchesQueryKey
} from '../../client/@tanstack/react-query.gen';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

const queryClient = new QueryClient();


function CreateBatchModal({ modalId }: { modalId: string; }) {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reactQueryClient = useQueryClient();

  // Fetch all images using React Query. Data will be cached.
  const { data: allImages = [], isLoading: isLoadingImages } = useQuery(getAllImagesOptions());

  // Mutation for creating a new batch
  const createBatch = useMutation(createBatchMutation());

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!batchName.trim()) {
      setError("Please provide a batch name.");
      return;
    }
    if (selectedImageIds.size === 0) {
      setError("Please select at least one image.");
      return;
    }
    setError(null);

    createBatch.mutate({
      body: {
        name: batchName,
        image_ids: Array.from(selectedImageIds),
      }
    }, {
      onSuccess: () => {
        // On success, invalidate the batches query to refetch the list
        reactQueryClient.invalidateQueries({ queryKey: getAllBatchesQueryKey() });
        handleClose();
      },
      onError: (err) => {
        setError("Failed to create batch. Please try again.");
        console.error(err);
      }
    });
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
            {isLoadingImages && <div className="flex justify-center p-4"><span className="loading loading-spinner"></span></div>}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {allImages.map(img => (
                <div key={img.id} onClick={() => handleImageSelect(img.id)} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer ring-offset-base-100 ring-offset-2 ${selectedImageIds.has(img.id) ? 'ring-2 ring-primary' : ''}`}>
                  <img src={`${API_BASE_URL}/images/thumbnail/${img.id}`} alt={img.original_filename} className="h-full w-full object-cover" />
                  {selectedImageIds.has(img.id) && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white">✓</div>}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
          <div className="modal-action mt-4">
            <button type="button" onClick={handleClose} className="btn">Cancel</button>
            <button type="submit" disabled={createBatch.isPending} className="btn btn-primary">
              {createBatch.isPending && <span className="loading loading-spinner"></span>}
              {createBatch.isPending ? 'Creating...' : 'Create Batch'}
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

// --- MAIN BATCHES PAGE COMPONENT ---
function BatchesPage() {
  const modalId = "create_batch_modal";
  const { data: batches = [], isLoading, error } = useQuery(getAllBatchesOptions());

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-12"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (error) {
      return (
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div><h3 className="font-bold">An Error Occurred</h3><div className="text-xs">Could not connect to the API.</div></div>
        </div>
      );
    }

    if (Array.isArray(batches) && batches.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batches.map(batch => {
            const previewImages = batch.image_associations.slice(0, 3);
            const totalImages = batch.image_associations.length;
            const totalGroups = new Set(
              batch.image_associations
                .map(assoc => assoc.group_label)
                .filter(label => label !== null && label !== '-1')
            ).size;

            const remainingImagesCount = totalImages > 3 ? `+${totalImages - 3}` : '';

            return (
              <Link key={batch.id} href={`/batches/${batch.id}`} className="card bg-base-100 shadow-xl group transition-all duration-300 ease-in-out border border-base-300 hover:border-primary hover:shadow-2xl">
                <div className="card-body p-6 relative overflow-hidden flex-row items-center">
                  {/* Stacked Image Previews */}
                  <div className="relative w-max h-40 flex-shrink-0">
                    {previewImages.slice().reverse().map((assoc, index) => {
                      const positionOffset = index * 8; // Reduced offset for tighter stacking

                      return (
                        <div
                          key={assoc.image.id}
                          className="absolute w-28 h-40 rounded-lg overflow-hidden bg-base-200"
                          style={{
                            bottom: '0px',
                            left: '0px',
                            transform: `translate(${positionOffset}px, -${positionOffset}px)`,
                            zIndex: 3 - index,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            transition: 'transform 0.3s ease-in-out',
                          }}
                        >
                          <img
                            src={`${API_BASE_URL}/images/thumbnail/${assoc.image.id}`}
                            alt="Batch image preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                      );
                    })}
                    {remainingImagesCount && (
                      <div
                        className="absolute w-28 h-40 rounded-lg flex items-center justify-center text-base-content text-lg bg-base-300 font-mono font-bold"
                        style={{
                          bottom: '0px',
                          left: '0px',
                          transform: `translate(${3 * 8}px, -${3 * 8}px)`,
                          zIndex: 0,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                      >
                        {remainingImagesCount}
                      </div>
                    )}
                    {previewImages.length === 0 && (
                      <div className="absolute w-28 h-40 rounded-lg flex items-center justify-center text-base-content text-opacity-50 text-center bg-base-200 border border-base-content"
                        style={{
                          bottom: '0px',
                          left: '0px',
                          transform: 'translate(15px, -15px)',
                          zIndex: 3
                        }}>
                        No Images
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-col justify-center ml-10 flex-grow font-mono">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="card-title text-xl font-bold text-primary truncate" title={batch.batch_name}>
                        {batch.batch_name}
                      </h2>
                      <div className={`badge ${batch.status === 'complete' ? 'badge-success' : 'badge-warning'} font-mono`}>
                        {batch.status}
                      </div>
                    </div>
                    <p className="text-base-content/80 text-sm mb-2">Total Images: {totalImages}</p>
                    <p className="text-base-content/80 text-sm">Total Groups: {totalGroups}</p>
                  </div>
                </div>
              </Link>
            );
          })}
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
      <CreateBatchModal modalId={modalId} />
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Clustering Batches</h1>
            <p className="mt-2 text-lg text-base-content text-opacity-70">Manage and analyze your image batches.</p>
          </div>
          <Button color="primary" onClick={() => (document.getElementById(modalId) as HTMLDialogElement)?.showModal()} className="">
            Create New Batch
          </Button>
        </header>
        {renderContent()}
      </div>
    </>
  );
}

// --- PROVIDER WRAPPER ---
export default function BatchesPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <BatchesPage />
    </QueryClientProvider>
  );
}