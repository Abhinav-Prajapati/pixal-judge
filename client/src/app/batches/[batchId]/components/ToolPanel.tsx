// File: app/batches/[batchId]/components/ToolPanel.tsx
"use client";

import { useState, useEffect } from 'react';
import { BatchResponse } from '@/api';
import { UseMutationResult } from '@tanstack/react-query';

// Define a type for the props for better readability
type ToolPanelProps = {
  batch: BatchResponse;
  analyzeMutation: UseMutationResult<BatchResponse, Error, { eps: number; min_samples: number; metric: string; }>;
  onRemoveSelected: () => void;
  onAddImagesClick: () => void;
  selectedCount: number;
};

export function ToolPanel({ batch, analyzeMutation, onRemoveSelected, onAddImagesClick, selectedCount }: ToolPanelProps) {
  // State for the form controls, initialized from the batch props
  const [eps, setEps] = useState(batch.parameters?.eps || 0.5);
  const [minSamples, setMinSamples] = useState(batch.parameters?.min_samples || 1);
  
  // Debounced effect to trigger the analysis mutation
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only run if the parameters have actually changed
      if (eps !== batch.parameters?.eps || minSamples !== batch.parameters?.min_samples) {
         analyzeMutation.mutate({ eps, min_samples: minSamples, metric: 'cosine' });
      }
    }, 500); // 500ms debounce delay

    return () => clearTimeout(handler);
  }, [eps, minSamples, batch.parameters, analyzeMutation]);

  // This is the missing part: the return statement with the JSX
  return (
    <aside className="card bg-base-100 shadow-xl w-80 flex-shrink-0 h-fit sticky top-12">
      <div className="card-body">
        <h2 className="card-title border-b border-base-300 pb-2">Tool Panel</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Manage Batch</h3>
            <div className="space-y-2">
              <button onClick={onAddImagesClick} className="btn btn-primary btn-block">Add Images</button>
              {selectedCount > 0 && (
                <button onClick={onRemoveSelected} className="btn btn-error btn-outline btn-block">Remove {selectedCount} Image(s)</button>
              )}
            </div>
          </div>
          <div className="divider"></div>
          <div>
            <h3 className="font-semibold mb-3">Groupe Controls</h3>
            <div className='form-control space-y-4'>
              <div>
                <label className="label">
                  <span className="label-text">Epsilon (eps): <span className="font-bold text-primary">{eps.toFixed(2)}</span></span>
                </label>
                <input type="range" min="0.1" max="1.0" step="0.02" value={eps} onChange={e => setEps(parseFloat(e.target.value))} className="range range-xs range-primary" />
              </div>
              <div>
                <label className="label"><span className="label-text">Min Samples</span></label>
                <div className="join w-full">
                  <button type="button" onClick={() => setMinSamples((prev: number) => Math.max(1, prev - 1))} className="btn join-item w-1/4">-</button>
                  <input type="text" value={minSamples} readOnly className="input input-bordered join-item w-1/2 text-center" />
                  <button type="button" onClick={() => setMinSamples((prev: number) => prev + 1)} className="btn join-item w-1/4">+</button>
                </div>
              </div>
              {analyzeMutation.isPending && (
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