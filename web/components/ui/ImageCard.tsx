"use client";

import { type ImageResponse } from "@/client/types.gen";
import Image from "next/image";
import React from "react";
import { siteConfig } from "@/config/site";
import { Image as ImageIcon, CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";

export function ImageCard({
  image,
  isSelected,
  onDetailClick,
  onSelectToggle,
}: {
  image: ImageResponse;
  isSelected: boolean;
  onDetailClick: (image: ImageResponse) => void;
  onSelectToggle: (image: ImageResponse) => void;
}) {
  const handleSelectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectToggle(image);
  };

  const handleDetailClick = () => {
    onDetailClick(image);
  };

  return (
    <div
      className={clsx(
        "relative flex flex-col aspect-square w-44 overflow-hidden bg-neutral-100 dark:bg-neutral-800 border group",
        "cursor-pointer transition-all duration-150 ease-in-out",
        isSelected
          ? "border-blue-500 border-1 shadow-lg"
          : "border-neutral-200 dark:border-neutral-700"
      )}
    >
      <div
        className="relative flex-grow min-h-0"
        onClick={handleDetailClick}
      >
        <Image
          src={siteConfig.urls.imageThumbnail(image.id)}
          alt={image.original_filename}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, 16vw"
          className="object-contain p-1"
        />
      </div>

      {/* Filename container - Click opens detail panel */}
      <div
        className="w-full flex-shrink-0 px-1 py-1 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
        onClick={handleDetailClick}
      >
        <p
          className="truncate text-center text-xs text-neutral-600 dark:text-neutral-400"
          title={image.original_filename}
        >
          <ImageIcon className="inline-block mr-1 align-text-bottom" size={14} />
          {image.original_filename}
        </p>
      </div>

      {/* Selection Checkmark Overlay - Click toggles selection */}
      <div
        className="absolute top-1 right-1 p-0.5 z-10"
        onClick={handleSelectClick}
      >
        {isSelected ? (
          <CheckCircle2
            size={18}
            strokeWidth={3}
            className="text-white bg-blue-500 rounded-full shadow"
          />
        ) : (
          <Circle
            size={18}
            strokeWidth={2}
            className="text-neutral-500 bg-white/70 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>

      {/* Hover overlay - this is just visual */}
      <div
        className="absolute inset-0 bg-black/10 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        onClick={handleDetailClick}
      />
    </div>
  );
}