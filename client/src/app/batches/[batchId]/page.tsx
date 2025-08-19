/*
  File: app/batches/[batchId]/page.tsx
  This is a dynamic client component that provides a full dashboard for managing
  and analyzing a single clustering batch, styled with DaisyUI.
*/
"use client";

import { useState, useEffect, useCallback, useRef, SyntheticEvent } from 'react';
import { OpenAPI, ClusteringBatchesService, BatchResponse, ImagesService, ImageResponse } from '../../../api';
import toast, { Toaster } from 'react-hot-toast';

// Configure the base URL for the API
OpenAPI.BASE = "http://127.0.0.1:8000";

// --- Reusable UI Components ---

function SelectableImage({ imageId, isSelected, onSelect }: { imageId: number; isSelected: boolean; onSelect: () => void; }) {
    const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
        width: '150px',
        height: '200px',
        opacity: 0,
        backgroundColor: 'hsl(var(--b2))', // Use DaisyUI background color variable
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
            className={`relative group cursor-pointer overflow-hidden shadow-md transition-all duration-500 ease-in-out ${isSelected ? 'ring-2 ring-primary ring-offset-base-100 ring-offset-2' : ''}`}
            onClick={onSelect}
        >
            <img
                src={`${OpenAPI.BASE}/images/thumbnail/${imageId}`}
                alt={`Image ${imageId}`}
                onLoad={handleImageLoad}
                className="h-full w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x200/eee/ccc?text=Error'; }}
            />
            <div className={`absolute top-2 right-2 w-5 h-5 rounded-sm border-2 border-base-100 bg-neutral bg-opacity-50 flex items-center justify-center transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isSelected && <div className="w-3 h-3 bg-base-100 rounded-sm" />}
            </div>
        </div>
    );
}

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

// --- Modals ---

function AddImagesModal({ modalId, batch, onUpdateComplete }: { modalId: string, batch: BatchResponse; onUpdateComplete: () => void; }) {
    const [availableImages, setAvailableImages] = useState<ImageResponse[]>([]);
    const [selectedToAdd, setSelectedToAdd] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const observer = new MutationObserver((mutations) => {
            if (dialog?.open && mutations.some(m => m.attributeName === 'open')) {
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
        });
        if (dialog) observer.observe(dialog, { attributes: true });
        return () => observer.disconnect();
    }, [batch.image_ids]);

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
            dialogRef.current?.close();
        } catch (err) {
            console.error("Failed to add images:", err);
            toast.error("Failed to add images.", { id: toastId });
        }
    };

    return (
        <dialog id={modalId} ref={dialogRef} className="modal">
            <div className="modal-box w-11/12 max-w-6xl h-[80vh] flex flex-col">
                <h3 className="font-bold text-2xl flex-shrink-0">Add Images to Batch</h3>
                <div className="flex-grow overflow-y-auto bg-base-200 rounded-lg p-4 my-4">
                    {isLoading ? <div className="flex justify-center p-4"><span className="loading loading-spinner"></span></div> : (
                        <div className="flex flex-wrap gap-2">
                            {availableImages.map(img => (
                                <SelectableImage key={img.id} imageId={img.id} isSelected={selectedToAdd.has(img.id)} onSelect={() => handleToggleSelection(img.id)} />
                            ))}
                        </div>
                    )}
                </div>
                <div className="modal-action mt-2 flex justify-between items-center">
                    <p className="text-base-content/70">{selectedToAdd.size} image(s) selected</p>
                    <div>
                        <button type="button" onClick={() => dialogRef.current?.close()} className="btn mr-2">Cancel</button>
                        <button type="button" onClick={handleAddSelected} disabled={selectedToAdd.size === 0} className="btn btn-primary">Add Selected</button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop"><button>close</button></form>
        </dialog>
    );
}

function ConfirmModal({ modalId, title, message, onConfirm }: { modalId: string, title: string, message: string, onConfirm: () => void }) {
    return (
        <dialog id={modalId} className="modal">
            <div className="modal-box">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="py-4">{message}</p>
                <div className="modal-action">
                    <form method="dialog" className='space-x-2'>
                        <button className="btn">Cancel</button>
                        <button className="btn btn-error" onClick={onConfirm}>Confirm</button>
                    </form>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop"><button>close</button></form>
        </dialog>
    )
}

// --- Tool Panel ---

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
        <aside className="card bg-base-100 shadow-xl w-full lg:w-80 flex-shrink-0 h-fit">
            <div className="card-body">
                <h2 className="card-title border-b border-base-300 pb-2">Tool Panel</h2>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Manage Batch</h3>
                        <div className="space-y-2">
                            <button onClick={onAddImagesClick} className="btn btn-primary btn-block">Add Images</button>
                            {selectedCount > 0 && (
                                <button onClick={onRemoveSelected} className="btn btn-error btn-outline btn-block">Remove {selectedCount} Image(s)</button>
                            )}
                        </div>
                    </div>
                    <div className="divider"></div>
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Analysis Controls</h3>
                        <div className='form-control space-y-4'>
                            <div>
                                <label className="label">
                                    <span className="label-text">Epsilon (eps): <span className="font-bold text-primary">{eps.toFixed(1)}</span></span>
                                </label>
                                <input type="range" min="0.1" max="1.0" step="0.1" value={eps} onChange={e => setEps(parseFloat(e.target.value))} className="range range-primary" />
                            </div>
                            <div>
                                <label className="label"><span className="label-text">Min Samples</span></label>
                                <input type="number" value={minSamples} onChange={e => setMinSamples(parseInt(e.target.value))} className="input input-bordered w-full" />
                            </div>
                            <div>
                                <label className="label"><span className="label-text">Metric</span></label>
                                <select value={metric} onChange={e => setMetric(e.target.value)} className="select select-bordered w-full">
                                    <option value="cosine">Cosine</option>
                                    <option value="euclidean">Euclidean</option>
                                </select>
                            </div>
                            {isAnalyzing && (
                                <div className="text-center text-primary font-semibold mt-4 flex items-center justify-center gap-2">
                                    <span className="loading loading-spinner loading-xs"></span>
                                    <p>Updating analysis...</p>
                                </div>
                            )}
                        </div>
                    </div>
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
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisParams, setAnalysisParams] = useState({ eps: 0.5, minSamples: 1, metric: 'cosine' });
    const isInitialMount = useRef(true);

    const addModalId = "add_images_modal";
    const removeModalId = "remove_confirm_modal";

    const fetchBatchDetails = useCallback(() => {
        if (!batchId) return;
        setLoading(true);
        ClusteringBatchesService.getBatchDetailsBatchesBatchIdGet(batchId)
            .then(setBatch)
            .catch(e => {
                setError(`Could not load details for batch ID ${batchId}.`);
            })
            .finally(() => setLoading(false));
    }, [batchId]);

    useEffect(() => {
        fetchBatchDetails();
    }, [fetchBatchDetails]);

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
        const toastId = toast.loading("Removing images...");
        try {
            await ClusteringBatchesService.removeImagesFromBatchBatchesBatchIdImagesDelete(batchId, {
                image_ids: Array.from(selectedImageIds)
            });
            toast.success("Images removed successfully!", { id: toastId });
            setSelectedImageIds(new Set());
            fetchBatchDetails();
        } catch (err) {
            toast.error("Failed to remove images.", { id: toastId });
        }
    };

    const clusterMap = batch?.cluster_summary?.cluster_map || {};
    const clusterEntries = Object.entries(clusterMap);

    const renderContent = () => {
        if (loading) {
            return <div className="text-center py-12"><span className="loading loading-spinner loading-lg"></span></div>;
        }
        if (error) {
            return <div role="alert" className="alert alert-error"><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span><b>Error:</b> {error}</span></div>;
        }
        if (batch) {
            return (
                <>
                    <header className="mb-8">
                        <h1 className="text-4xl font-extrabold">{batch.batch_name}</h1>
                        <p className="mt-2 text-lg text-base-content/70">Status: {batch.status} | {batch.image_ids.length} Images</p>
                    </header>
                    <div className="flex flex-col lg:flex-row gap-8">
                        <ToolPanel
                            batch={batch}
                            onParamsChange={setAnalysisParams}
                            isAnalyzing={isAnalyzing}
                            selectedCount={selectedImageIds.size}
                            onRemoveSelected={() => (document.getElementById(removeModalId) as HTMLDialogElement)?.showModal()}
                            onAddImagesClick={() => (document.getElementById(addModalId) as HTMLDialogElement)?.showModal()}
                        />
                        <div className={`flex-grow space-y-10 transition-opacity duration-300 ${isAnalyzing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                            {clusterEntries.length > 0 ? (
                                clusterEntries.map(([clusterId, imageIds]) => (
                                    <section key={clusterId} className="card bg-base-100 shadow-lg">
                                        <div className="card-body">
                                            <h2 className="card-title text-2xl">
                                                Cluster {clusterId}
                                                <span className="badge badge-ghost ml-2">{(imageIds as number[]).length} images</span>
                                            </h2>
                                            <div className="divider my-2"></div>
                                            <ImageGrid imageIds={imageIds as number[]} selectedIds={selectedImageIds} onImageSelect={handleToggleSelection} />
                                        </div>
                                    </section>
                                ))
                            ) : (
                                <div className="hero bg-base-100 rounded-lg shadow-md">
                                    <div className="hero-content text-center">
                                        <div className="max-w-md">
                                            <h1 className="text-3xl font-bold">No Clusters Found</h1>
                                            <p className="py-6">This batch hasn't been analyzed yet, or the current parameters resulted in no clusters.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            );
        }
        return null; // Should not happen if no error
    }

    return (
        <>
            <Toaster position="bottom-right" />
            {batch && <AddImagesModal modalId={addModalId} batch={batch} onUpdateComplete={fetchBatchDetails} />}
            <ConfirmModal
                modalId={removeModalId}
                title="Confirm Removal"
                message={`Are you sure you want to remove ${selectedImageIds.size} image(s) from this batch?`}
                onConfirm={handleRemoveSelected}
            />
            <div className="container mx-auto px-4 py-8">
                {renderContent()}
            </div>
        </>
    );
}