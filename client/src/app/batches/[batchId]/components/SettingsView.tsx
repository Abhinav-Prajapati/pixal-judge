'use client'
import { useState } from "react";

export function SettingsView() {
  const [sensitivity, setSensitivity] = useState(0.5);
  const [minImages, setMinImages] = useState(1);

  return (
    <div className="p-4 space-y-4">
      {/* Cluster Sensitivity Slider */}
      <div>
        <label className="label">
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
          className="range range-primary"
        />
        <div className="flex justify-between text-xs px-1">
          <span>0</span>
          <span>1</span>
        </div>
      </div>

      {/* Min Images Per Group Stepper */}
      <div>
        <label className="label">
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

      {/* Action Button */}
      <div>
        <button className="btn btn-neutral w-full">Make Group</button>
      </div>
    </div>
  );
}
