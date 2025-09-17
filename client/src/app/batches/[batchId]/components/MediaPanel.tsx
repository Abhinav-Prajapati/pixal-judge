'use client'
import type { BatchResponse } from '@/client/types.gen';
import { MediaView } from './MediaView';

interface MediaPanelProps {
  batch: BatchResponse;
}

export function MediaPanel({ batch }: MediaPanelProps) {
  return (
    <div className="flex flex-row card bg-base-300 text-white w-100 h-120 m-3">
      <div className="w-px bg-base-100" />
      <main className="flex-1 overflow-y-auto">
        <MediaView batch={batch} />
      </main>
    </div>
  );
}