'use client'
import { useState, useEffect } from "react";
import { useBatchStore } from "../store/useBatchStore";

export function SettingsView() {
  const { batch, analyzeBatch, loading } = useBatchStore();

  const [sensitivity, setSensitivity] = useState(0.5);
  const [minImages, setMinImages] = useState(1);

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
    if (!batch) return;

    analyzeBatch({
      eps: sensitivity,
      min_samples: minImages,
    });
  };

  return (
    <div className="px-3 py-2">
      <div>
        <button
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32 disabled:bg-base-300 disabled:cursor-not-allowed"
          onClick={handleAnalyze}
          disabled={!batch || loading}
        >
          {loading ? "Analyzing..." : "Analysis"}
        </button>
      </div>

      {/* Min Images Per Group Stepper */}
      <div>
        <label className="label my-3">
          <span className="label-text">Min Images per Group</span>
        </label>
        <div className="join">
          <button
            className="btn join-item"
            onClick={() => setMinImages((prev) => Math.max(1, prev - 1))}
            disabled={loading} // Disable controls during analysis
          >
            -
          </button>
          <input
            type="number"
            value={minImages}
            onChange={(e) => setMinImages(Math.max(1, Number(e.target.value)))}
            className="input input-bordered join-item w-20 text-center"
            disabled={loading}
          />
          <button
            className="btn join-item"
            onClick={() => setMinImages((prev) => prev + 1)}
            disabled={loading}
          >
            +
          </button>
        </div>
      </div>

      {/* Cluster Sensitivity Slider */}
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
          disabled={loading}
        />
      </div>
    </div>
  );
}