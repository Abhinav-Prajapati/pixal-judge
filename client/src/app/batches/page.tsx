/*
  File: app/batches/page.tsx
  This is a client component for managing clustering batches. It allows users
  to view existing batches and create new ones via a modal.
*/
"use client";

import { useState, useEffect, FormEvent, useCallback } from 'react';
import Link from 'next/link';
import { OpenAPI, ClusteringBatchesService, ImagesService, BatchResponse, ImageResponse } from '../../api';

// Configure the base URL for the API
OpenAPI.BASE = "http://127.0.0.1:8000";

// --- Modal Component for Creating a New Batch ---
function CreateBatchModal({ isOpen, onClose, onBatchCreated }: { isOpen: boolean; onClose: () => void; onBatchCreated: () => void; }) {
  const [allImages, setAllImages] = useState<ImageResponse[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch all images when the modal is opened
      setIsLoading(true);
      ImagesService.getAllImagesImagesGet()
        .then(setAllImages)
        .catch(() => setError("Failed to load images for selection."))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!batchName || selectedImageIds.size === 0) {
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
      onBatchCreated(); // Refresh the list on the main page
      onClose(); // Close the modal
    } catch (err) {
      setError("Failed to create batch. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-4">Create New Batch</h2>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
          <input
            type="text"
            placeholder="Enter Batch Name"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="w-full p-2 border rounded-md mb-4"
          />
          <p className="mb-2 font-semibold">Select Images ({selectedImageIds.size} selected)</p>
          <div className="flex-grow border rounded-md p-2 overflow-y-auto">
            {isLoading && <p>Loading images...</p>}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {allImages.map(img => (
                <div key={img.id} onClick={() => handleImageSelect(img.id)} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-4 ${selectedImageIds.has(img.id) ? 'border-indigo-500' : 'border-transparent'}`}>
                  <img src={`${OpenAPI.BASE}/images/thumbnail/${img.id}`} alt={img.original_filename} className="h-full w-full object-cover" />
                  {selectedImageIds.has(img.id) && <div className="absolute inset-0 bg-black bg-opacity-40"></div>}
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="mt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
              {isLoading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// --- Main Batches Page Component ---
export default function BatchesPage() {
  const [batches, setBatches] = useState<BatchResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <CreateBatchModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onBatchCreated={fetchBatches}
      />
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Clustering Batches</h1>
            <p className="mt-2 text-lg text-gray-600">Manage and analyze your image batches.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 transition-colors">
            Create New Batch
          </button>
        </header>

        {loading ? (
          <div className="text-center py-12"><p className="text-xl text-gray-500">Loading batches...</p></div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
            <p className="font-bold">An Error Occurred</p><p>{error}</p>
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {batches.map(batch => (
              <Link key={batch.id} href={`/batches/${batch.id}`}>
                <div className="block bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-indigo-600">{batch.batch_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ID: {batch.id}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-gray-700">{batch.image_ids.length} images</span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${batch.status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {batch.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-xl text-gray-500">No batches found. Create one to get started!</p></div>
        )}
      </div>
    </main>
  );
}
