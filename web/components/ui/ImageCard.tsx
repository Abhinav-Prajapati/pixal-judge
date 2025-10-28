import { type ImageResponse } from '@/client';
import Image from 'next/image';
import React from 'react';
import { siteConfig } from '@/config/site';
import { Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

import { useImageSelectionStore } from '@/lib/stores/useImageSelectionStore';

export function ImageCard({ image }: { image: ImageResponse }) {
  const { selectedImageIds, toggleImage } = useImageSelectionStore();
  const isSelected = selectedImageIds.has(image.id);

  const handleToggleSelection = () => {
    toggleImage(image.id);
  };

  return (
    <div
      onClick={handleToggleSelection}
      className={clsx(
        "relative flex flex-col aspect-square w-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border group",
        "cursor-pointer transition-all duration-150 ease-in-out",
        isSelected
          ? "border-blue-500 border-1 shadow-lg" // Selected state
          : "border-neutral-200 dark:border-neutral-700" // Default state
      )}
    >
      {/* Image container */}
      <div className="relative flex-grow min-h-0">
        <Image
          src={siteConfig.urls.imageThumbnail(image.id)}
          alt={image.original_filename}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 16vw"
          className="object-contain p-1"
        />
      </div>
      {/* Filename container */}
      <div className="w-full flex-shrink-0 px-1 py-1 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
        <p className="truncate text-center text-xs text-neutral-600 dark:text-neutral-400" title={image.original_filename}>
          <ImageIcon className='inline-block mr-1 align-text-bottom' size={14} />
          {image.original_filename}
        </p>
      </div>

      {/* Selection Checkmark Overlay */}
      {isSelected && (
        <div className="absolute top-1 right-1 p-0.5 bg-blue-500 rounded-full text-white z-10 shadow">
          <CheckCircle2 size={16} strokeWidth={3} />
        </div>
      )}

      <div className="absolute inset-0 bg-black/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
    </div>
  );
}
