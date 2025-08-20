// File: app/batches/[batchId]/components/ImageGrid.tsx
"use client";

import { SelectableImage } from './SelectableImage';

export function ImageGrid({ imageIds, selectedIds, onImageSelect }: { 
  imageIds: number[]; 
  selectedIds: Set<number>; 
  onImageSelect: (id: number) => void; 
}) {
  return (
    <div className="flex flex-wrap gap-2">
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