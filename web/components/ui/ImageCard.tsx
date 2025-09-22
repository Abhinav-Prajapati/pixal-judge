import { type ImageResponse } from '@/client';
import Image from 'next/image';
import React from 'react';
import { siteConfig } from '@/config/site';
import { Image as ImageIcon } from 'lucide-react';


export function ImageCard({ image }: { image: ImageResponse }) {
  return (
    <div className="flex flex-col aspect-square w-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
      {/* Image container that grows to fill available space */}
      <div className="relative flex-grow min-h-0">
        <Image
          src={siteConfig.urls.imageThumbnail(image.id)}
          alt={image.original_filename}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 16vw"
          className="object-contain p-1"
        />
      </div>
      {/* Filename container at the bottom */}
      <div className="w-full flex-shrink-0 px-1 py-1 border-t border-neutral-200 dark:border-neutral-700">
        <p className="truncate text-center text-xs text-neutral-600 dark:text-neutral-400" title={image.original_filename}>
          <ImageIcon className='inline-block mr-1' size={16} />
          {image.original_filename}
        </p>
      </div>
    </div>
  );
}