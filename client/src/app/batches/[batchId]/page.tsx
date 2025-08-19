/*
  File: app/batches/[batchId]/page.tsx
  This is a dynamic client component that provides a full dashboard for managing
  and analyzing a single clustering batch with direct image selection.
*/
"use client";

import { useState, useEffect, useCallback, useRef, SyntheticEvent } from 'react';
import { OpenAPI, ClusteringBatchesService, BatchResponse, ImagesService, ImageResponse } from '../../../api';
import toast, { Toaster } from 'react-hot-toast';

// Configure the base URL for the API
OpenAPI.BASE = "http://127.0.0.1:8000";

// --- Reusable UI Components ---

// UPDATED: Merged ThumbnailImage and added dynamic sizing logic
function SelectableImage({ imageId, isSelected, onSelect }: { imageId: number; isSelected: boolean; onSelect: () => void; }) {
    const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
        width: '150px', // Default placeholder width
        height: '200px',
        opacity: 0,      // Start hidden
        backgroundColor: '#f0f0f0', // Placeholder color
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
            className={`relative group cursor-pointer overflow-hidden shadow-md transition-all duration-500 ease-in-out ${isSelected ? 'ring-4 ring-blue-500' : ''}`}
            onClick={onSelect}
        >
            <img
                src={`${OpenAPI.BASE}/images/thumbnail/${imageId}`}
                alt={`Image ${imageId}`}
                onLoad={handleImageLoad}
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/eee/ccc?text=Error'; }}
            />
            <div className={`absolute top-2 right-2 w-5 h-5 rounded-sm border-2 border-white bg-gray-800 bg-opacity-50 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isSelected && <div className="w-3 h-3 bg-white rounded-sm" />}
            </div>
        </div>
    );
}

// UPDATED: Changed from grid to flex for variable widths
function ImageGrid({ imageIds, selectedIds, onImageSelect }: { imageIds: number[]; selectedIds: Set<number>; onImageSelect: (id: number) => void; }) {
    return (
        <div className="flex flex-wrap gap-3">
            {imageIds.map(id => (
                <SelectableImage
                    key={id}
                    imageId={id}
                    isSelected={selectedIds.has(id)}
                    onSelect={() => onImageSelect(id)}
                />
            ))}
        </div>
    );
}

// --- NEW: Modal for Adding Images ---
function AddImagesModal({ isOpen, onClose, batch, onUpdateComplete }: { isOpen: boolean; onClose: () => void; batch: BatchResponse; onUpdateComplete: () => void; }) {
    const [availableImages, setAvailableImages] = useState<ImageResponse[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setSelectedToAdd(new Set());
            const currentIds = new Set(batch.image_ids);
            ImagesService.getAllImagesImagesGet()
                .then(allImages => {
                    setAvailableImages(allImages.filter(img => !currentIds.has(img.id)));
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, batch.image_ids]);

    const handleToggleSelection = (imageId: number) => {
        setSelectedToAdd(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) newSet.delete(imageId);
            else newSet.add(imageId);
            return newSet;
        });
    };

    const handleAddSelected = async () => {
        if (selectedToAdd.size === 0) return;
        const toastId = toast.loading("Adding images...");
        try {
            await ClusteringBatchesService.addImagesToBatchBatchesBatchIdImagesPost(batch.id, {
                image_ids: Array.from(selectedToAdd)
            });
            toast.success("Images added successfully!", { id: toastId });
            onUpdateComplete();
            onClose();
        } catch (err) {
            console.error("Failed to add images:", err);
            toast.error("Failed to add images.", { id: toastId });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl h-[80vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 flex-shrink-0">Add Images to Batch</h2>
                {isLoading ? <p>Loading available images...</p> : (
                    <div className="flex-grow overflow-y-auto border rounded-lg p-4">
                        {/* UPDATED: Changed from grid to flex for variable widths */}
                        <div className="flex flex-wrap gap-1">
                            {availableImages.map(img => (
                                <SelectableImage
                                    key={img.id}
                                    imageId={img.id}
                                    isSelected={selectedToAdd.has(img.id)}
                                    onSelect={() => handleToggleSelection(img.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div className="mt-6 flex justify-between items-center flex-shrink-0">
                    <p className="text-gray-600">{selectedToAdd.size} image(s) selected</p>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                        <button
                            type="button"
                            onClick={handleAddSelected}
                            disabled={selectedToAdd.size === 0}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-400"
                        >
                            Add Selected
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Tool Panel (Unchanged) ---
function ToolPanel({ batch, onParamsChange, isAnalyzing, selectedCount, onRemoveSelected, onAddImagesClick }: {
    batch: BatchResponse | null;
    onParamsChange: (params: { eps: number, minSamples: number, metric: string }) => void;
    isAnalyzing: boolean;
    selectedCount: number;
    onRemoveSelected: () => void;
    onAddImagesClick: () => void;
}) {
    const [eps, setEps] = useState(0.5);
    const [minSamples, setMinSamples] = useState(1);
    const [metric, setMetric] = useState('cosine');

    useEffect(() => {
        if (batch?.parameters) {
            setEps(batch.parameters.eps || 0.5);
            setMinSamples(batch.parameters.min_samples || 1);
            setMetric(batch.parameters.metric || 'cosine');
        }
    }, [batch]);

    useEffect(() => {
        onParamsChange({ eps, minSamples, metric });
    }, [eps, minSamples, metric, onParamsChange]);

    return (
        <aside className="w-full lg:w-80 flex-shrink-0 bg-white p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-2xl font-bold mb-4 border-b pb-2">Tool Panel</h2>
            <div className="space-y-6">
                {/* Batch Management Section */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Manage Batch</h3>
                    <div className="space-y-2">
                        <button
                            onClick={onAddImagesClick}
                            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors"
                        >
                            Add Images
                        </button>
                        {selectedCount > 0 && (
                            <button
                                onClick={onRemoveSelected}
                                className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-full hover:bg-red-700 transition-colors"
                            >
                                Remove {selectedCount} Image(s)
                            </button>
                        )}
                    </div>
                </div>
                {/* Analysis Controls */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Analysis Controls</h3>
                    <div>
                        <label htmlFor="eps-slider" className="block text-sm font-medium text-gray-700">
                            Epsilon (eps): <span className="font-bold text-indigo-600">{eps.toFixed(1)}</span>
                        </label>
                        <input id="eps-slider" type="range" min="0.1" max="1.0" step="0.1" value={eps} onChange={e => setEps(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2" />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="min-samples" className="block text-sm font-medium text-gray-700">Min Samples</label>
                        <input id="min-samples" type="number" value={minSamples} onChange={e => setMinSamples(parseInt(e.target.value))} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="metric" className="block text-sm font-medium text-gray-700">Metric</label>
                        <select id="metric" value={metric} onChange={e => setMetric(e.target.value)} className="mt-1 w-full p-2 border rounded-md bg-white">
                            <option value="cosine">Cosine</option>
                            <option value="euclidean">Euclidean</option>
                        </select>
                    </div>
                    {isAnalyzing && (
                        <div className="text-center text-indigo-600 font-semibold mt-4">
                            <p>Updating analysis...</p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}


// --- Main Batch Detail Page Component ---
export default function BatchDetailPage({ params }: { params: { batchId: string } }) {
    const batchId = parseInt(params.batchId, 10);
    const [batch, setBatch] = useState<BatchResponse | null>(null);
    const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisParams, setAnalysisParams] = useState({ eps: 0.5, minSamples: 1, metric: 'cosine' });
    const isInitialMount = useRef(true);

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

    // Debounced effect to re-run analysis
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        const runAnalysis = async () => {
            setIsAnalyzing(true);
            try {
                const updatedBatch = await ClusteringBatchesService.analyzeBatchBatchesBatchIdAnalyzePut(batchId, {
                    eps: analysisParams.eps, min_samples: analysisParams.minSamples, metric: analysisParams.metric
                });
                setBatch(updatedBatch);
                setSelectedImageIds(new Set());
            } catch (err) {
                console.error('Analysis failed:', err);
                toast.error("Analysis failed.");
            } finally {
                setIsAnalyzing(false);
            }
        };
        const handler = setTimeout(() => { runAnalysis(); }, 500);
        return () => { clearTimeout(handler); };
    }, [analysisParams, batchId]);

    const handleToggleSelection = (imageId: number) => {
        setSelectedImageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(imageId)) newSet.delete(imageId);
            else newSet.add(imageId);
            return newSet;
        });
    };

    const handleRemoveSelected = async () => {
        if (selectedImageIds.size === 0) return;
        // NOTE: window.confirm can be problematic. A custom modal is a better UX.
        if (!confirm(`Are you sure you want to remove ${selectedImageIds.size} image(s) from this batch?`)) return;

        const toastId = toast.loading("Removing images...");
        try {
            await ClusteringBatchesService.removeImagesFromBatchBatchesBatchIdImagesDelete(batchId, {
                image_ids: Array.from(selectedImageIds)
            });
            toast.success("Images removed successfully!", { id: toastId });
            setSelectedImageIds(new Set());
            fetchBatchDetails();
        } catch (err) {
            console.error("Failed to remove images:", err);
            toast.error("Failed to remove images.", { id: toastId });
        }
    };

    const clusterMap = batch?.cluster_summary?.cluster_map || {};
    const clusterEntries = Object.entries(clusterMap);

    return (
        <main className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Toaster position="bottom-right" />
            {batch && (
                <AddImagesModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    batch={batch}
                    onUpdateComplete={fetchBatchDetails}
                />
            )}
            <div className="container mx-auto px-4 py-8">
                {loading ? (
                    <div className="text-center py-12"><p className="text-xl text-gray-500">Loading batch details...</p></div>
                ) : error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md">
                        <p className="font-bold">An Error Occurred</p><p>{error}</p>
                    </div>
                ) : batch && (
                    <>
                        <header className="mb-8">
                            <h1 className="text-4xl font-extrabold text-gray-900">{batch.batch_name}</h1>
                            <p className="mt-2 text-lg text-gray-600">Status: {batch.status} | {batch.image_ids.length} Images</p>
                        </header>

                        <div className="flex flex-col lg:flex-row gap-8">
                            <ToolPanel
                                batch={batch}
                                onParamsChange={setAnalysisParams}
                                isAnalyzing={isAnalyzing}
                                selectedCount={selectedImageIds.size}
                                onRemoveSelected={handleRemoveSelected}
                                onAddImagesClick={() => setIsAddModalOpen(true)}
                            />
                            <div className={`flex-grow space-y-10 transition-opacity duration-300 ${isAnalyzing ? 'opacity-50' : 'opacity-100'}`}>
                                {clusterEntries.length > 0 ? (
                                    clusterEntries.map(([clusterId, imageIds]) => (
                                        <section key={clusterId}>
                                            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-gray-200">
                                                Cluster {clusterId}
                                                <span className="text-base font-normal text-gray-500 ml-3">({(imageIds as number[]).length} images)</span>
                                            </h2>
                                            <ImageGrid
                                                imageIds={imageIds as number[]}
                                                selectedIds={selectedImageIds}
                                                onImageSelect={handleToggleSelection}
                                            />
                                        </section>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                                        <h3 className="text-xl font-semibold text-gray-700">No Clusters Found</h3>
                                        <p className="text-gray-500 mt-2">This batch has not been analyzed yet or the current parameters resulted in no clusters.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}