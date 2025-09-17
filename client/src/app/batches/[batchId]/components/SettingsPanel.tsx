'use client'
import { useState, useEffect } from "react";
import type { BatchResponse } from "@/client/types.gen";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  analyzeBatchMutation
} from "@/client/@tanstack/react-query.gen";

interface SettingsPanelProps {
  batch: BatchResponse;
}

export function SettingsPanel({ batch }: SettingsPanelProps) {
  const queryClient = useQueryClient();
  const [sensitivity, setSensitivity] = useState(0.5);
  const [minImages, setMinImages] = useState(1);

  const analyzeMutation = useMutation({
    mutationFn: analyzeBatchMutation().mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getBatch', { path: { batch_id: batch.id } }] });
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
    },
  });

  useEffect(() => {
    if (batch?.parameters) {
      if (typeof batch.parameters.eps === 'number') {
        setSensitivity(batch.parameters.eps);
      }
      if (typeof batch.parameters.min_samples === 'number') {
        setMinImages(batch.parameters.min_samples);
      }
    }
  }, [batch]);

  const handleAnalyze = () => {
    analyzeMutation.mutate({
      path: { batch_id: batch.id },
      body: {
        eps: sensitivity,
        min_samples: minImages,
      },
    });
  };

  const isLoading = analyzeMutation.isPending;

  return (
    <div className="px-3 py-2">
      <div>
        <button
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:bg-base-300 disabled:cursor-not-allowed"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {analyzeMutation.isPending ? "Analyzing..." : "Analysis"}
        </button>
      </div>
      <div>
        <label className="label my-3">
          <span className="label-text">Min Images per Group</span>
        </label>
        <div className="join">
          <button
            className="btn join-item"
            onClick={() => setMinImages((prev) => Math.max(1, prev - 1))}
            disabled={isLoading}
          >
            -
          </button>
          <input
            type="number"
            value={minImages}
            onChange={(e) => setMinImages(Math.max(1, Number(e.target.value)))}
            className="input input-bordered join-item w-20 text-center"
            disabled={isLoading}
          />
          <button
            className="btn join-item"
            onClick={() => setMinImages((prev) => prev + 1)}
            disabled={isLoading}
          >
            +
          </button>
        </div>
      </div>
      <div>
        <label className="label my-3">
          <span className="label-text">Cluster Sensitivity</span>
          <span className="label-text-alt">{sensitivity.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.02}
          value={sensitivity}
          onChange={(e) => setSensitivity(parseFloat(e.target.value))}
          className="range range-xs range-primary"
          disabled={isLoading}
        />
      </div>
    </div>
  );
}