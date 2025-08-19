/*
  File: app/batches/[batchId]/page.tsx
  This is a dynamic client component that provides a full dashboard for managing
  and analyzing a single clustering batch.
*/
"use client";

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { OpenAPI, ClusteringBatchesService, BatchResponse, ImagesService, ImageResponse } from '../../../api';

// Configure the base URL for the API
OpenAPI.BASE = "http://127.0.0.1:8000";

// --- Reusable Components ---
function ThumbnailImage({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/eee/ccc?text=Error'; }} />;
}

function ImageGrid({ imageIds }: { imageIds: number[] }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
      {imageIds.map(id => (
        <div key={id} className="aspect-square overflow-hidden rounded-md shadow-md">
          <ThumbnailImage src={`${OpenAPI.BASE}/images/thumbnail/${id}`} alt={`Image ${id}`} />
        </div>
      ))}
    </div>
  );
}

// --- Modal for Analyzing a Batch ---
function AnalyzeBatchModal({ batchId, isOpen, onClose, onAnalysisComplete }: { batchId: number; isOpen: boolean; onClose: () => void; onAnalysisComplete: () => void; }) {
    const [eps, setEps] = useState(0.5);
    const [minSamples, setMinSamples] = useState(1);
    const [metric, setMetric] = useState('cosine');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await ClusteringBatchesService.analyzeBatchBatchesBatchIdAnalyzePut(batchId, { eps, min_samples: minSamples, metric });
            onAnalysisComplete();
            onClose();
        } catch (err) {
            setError('Analysis failed. Please check parameters and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Analyze Batch</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Epsilon (eps)</label>
                        <input type="number" step="0.1" value={eps} onChange={e => setEps(parseFloat(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Min Samples</label>
                        <input type="number" value={minSamples} onChange={e => setMinSamples(parseInt(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Metric</label>
                        <select value={metric} onChange={e => setMetric(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option value="cosine">Cosine</option>
                            <option value="euclidean">Euclidean</option>
                        </select>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="mt-6 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400">
                            {isLoading ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


// --- Main Batch Detail Page Component ---
export default function BatchDetailPage({ params }: { params: { batchId: string } }) {
  const batchId = parseInt(params.batchId, 10);
  const [batch, setBatch] = useState<BatchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzeModalOpen, setAnalyzeModalOpen] = useState(false);

  const fetchBatchDetails = useCallback(() => {
    if (!batchId) return;
    setLoading(true);
    ClusteringBatchesService.getBatchDetailsBatchesBatchIdGet(batchId)
      .then(setBatch)
      .catch(e => {
        console.error(`Failed to fetch batch ${batchId}:`, e);
        setError(`Could not load details for batch ID ${batchId}.`);
      })
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    fetchBatchDetails();
  }, [fetchBatchDetails]);

  const clusterMap = batch?.cluster_summary?.cluster_map || {};
  const clusterEntries = Object.entries(clusterMap);

  return (
    <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <AnalyzeBatchModal 
        batchId={batchId}
        isOpen={isAnalyzeModalOpen}
        onClose={() => setAnalyzeModalOpen(false)}
        onAnalysisComplete={fetchBatchDetails}
      />
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12"><p className="text-xl text-gray-500">Loading batch details...</p></div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
            <p className="font-bold">An Error Occurred</p><p>{error}</p>
          </div>
        ) : batch && (
          <>
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900">{batch.batch_name}</h1>
                <p className="mt-2 text-lg text-gray-600">Status: {batch.status}</p>
              </div>
              <div className="flex gap-4 mt-4 sm:mt-0">
                <button onClick={() => setAnalyzeModalOpen(true)} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors">
                  Analyze Batch
                </button>
              </div>
            </header>
            
            <div className="space-y-10">
              {clusterEntries.length > 0 ? (
                clusterEntries.map(([clusterId, imageIds]) => (
                  <section key={clusterId}>
                    <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-gray-200">
                      Cluster {clusterId} 
                      <span className="text-base font-normal text-gray-500 ml-3">({(imageIds as number[]).length} images)</span>
                    </h2>
                    <ImageGrid imageIds={imageIds as number[]} />
                  </section>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <h3 className="text-xl font-semibold text-gray-700">No Clusters Found</h3>
                  <p className="text-gray-500 mt-2">This batch has not been analyzed yet or the analysis resulted in no distinct clusters.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
