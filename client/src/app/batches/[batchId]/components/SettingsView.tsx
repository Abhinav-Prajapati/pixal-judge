'use client'
import { useState } from "react";

export function SettingsView() {
  const [sensitivity, setSensitivity] = useState(0.5);
  const [minImages, setMinImages] = useState(1);

  return (
    <div className="px-3 py-2">
      {/* Action Button */}
      <div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-full bg-base-100 hover:bg-white/20 transition-colors w-32">
          Analysis</button>
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
          >
            -
          </button>
          <input
            type="number"
            value={minImages}
            onChange={(e) => setMinImages(Math.max(1, Number(e.target.value)))}
            className="input input-bordered join-item w-20 text-center"
          />
          <button
            className="btn join-item"
            onClick={() => setMinImages((prev) => prev + 1)}
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
        />
      </div>
    </div>
  );
}
