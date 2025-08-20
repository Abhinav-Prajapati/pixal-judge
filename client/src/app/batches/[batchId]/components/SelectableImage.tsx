// File: app/batches/[batchId]/components/SelectableImage.tsx
"use client";

import { useState, SyntheticEvent } from 'react';
import { OpenAPI } from '@/api';

export function SelectableImage({ imageId, isSelected, onSelect }: { 
  imageId: number; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const [containerStyle, setContainerStyle] = useState<React.CSSProperties>({
    width: '150px',
    height: '200px',
    opacity: 0,
    backgroundColor: 'hsl(var(--b2))', // DaisyUI background color variable
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