"use client";

import type {
  GetImageMetadataError,
  ImageResponse,
  Metadata,
} from "@/client/types.gen";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@heroui/react";
import {
  X,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Camera,
  Focus,
  Aperture,
  Timer,
  Sun,
  Text,
  Star,
} from "lucide-react";

import { siteConfig } from "@/config/site";
import { getImageMetadata } from "@/client";

function MetadataRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="flex items-start gap-3">
      <Icon className="text-default-500 flex-shrink-0 mt-0.5" size={14} />
      <div className="flex flex-col">
        <span className="text-xs text-default-600">{label}</span>
        <span className="text-sm text-default-900 break-all">
          {String(value)}
        </span>
      </div>
    </div>
  );
}

function MetadataDisplay({ metadata }: { metadata: Metadata }) {
  const shotAtFormatted = metadata.shot_at
    ? new Date(metadata.shot_at).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  const ratingFormatted = metadata.rating
    ? "★".repeat(metadata.rating) + "☆".repeat(5 - metadata.rating)
    : null;

  const dimensions =
    metadata.width && metadata.height
      ? `${metadata.width} x ${metadata.height}`
      : null;

  const location =
    metadata.latitude && metadata.longitude
      ? `${metadata.latitude.toFixed(4)}, ${metadata.longitude.toFixed(4)}`
      : null;

  const camera = [metadata.camera_make, metadata.camera_model]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-4">
      <MetadataRow icon={ImageIcon} label="Dimensions" value={dimensions} />
      <MetadataRow icon={Calendar} label="Shot At" value={shotAtFormatted} />
      <MetadataRow icon={Camera} label="Camera" value={camera} />
      <MetadataRow icon={MapPin} label="Location" value={location} />
      <MetadataRow
        icon={Aperture}
        label="Aperture"
        value={metadata.f_number ? `f/${metadata.f_number}` : null}
      />
      <MetadataRow
        icon={Focus}
        label="Focal Length"
        value={metadata.focal_length}
      />
      <MetadataRow
        icon={Timer}
        label="Exposure Time"
        value={metadata.exposure_time}
      />
      <MetadataRow icon={Sun} label="ISO" value={metadata.iso} />
      <MetadataRow icon={Star} label="Rating" value={ratingFormatted} />

      {metadata.caption && (
        <div className="flex items-start gap-3">
          <Text className="text-default-500 flex-shrink-0 mt-0.5" size={14} />
          <div className="flex flex-col">
            <span className="text-xs text-default-600">Caption</span>
            <p className="text-sm text-default-900 break-words whitespace-pre-wrap">
              {metadata.caption}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ImageDetailPanel({
  image,
  onClose,
}: {
  image: ImageResponse;
  onClose: () => void;
}) {
  const imageUrl = siteConfig.urls.image(image.id);

  const {
    data: metadata,
    isLoading,
    isError,
  } = useQuery<Metadata, GetImageMetadataError>({
    queryKey: ["imageMetadata", image.id],
    queryFn: async () => {
      const response = await getImageMetadata({
        path: { image_id: image.id },
        throwOnError: true,
      });

      return response.data;
    },
    enabled: !!image.id,
  });

  return (
    <div className="flex flex-col w-98 flex-shrink-0 h-screen sticky top-0 border-l border-default-200 bg-content1">
      {/* Panel Header */}
      <div className="flex flex-shrink-0 items-center justify-between p-2 border-b border-default-200">
        <h2
          className="text-lg font-semibold truncate"
          title={image.original_filename}
        >
          {image.original_filename}
        </h2>
        <Button
          isIconOnly
          aria-label="Close panel"
          color="default"
          variant="light"
          onPress={onClose}
        >
          <X size={20} />
        </Button>
      </div>

      {/* Panel Content (Scrollable) */}
      <div className="flex-grow overflow-y-auto">
        {/* Image on top */}
        <div className="bg-black p-1">
          <img
            alt={image.filename}
            className="w-full h-auto object-contain max-h-96"
            src={imageUrl}
          />
        </div>

        <div className="p-4">
          <h3 className="font-semibold mb-3 text-default-800">Metadata</h3>
          <div className="text-sm">
            {isLoading && (
              <p className="text-default-500">Loading metadata...</p>
            )}
            {isError && <p className="text-danger">Failed to load metadata.</p>}
            {metadata && <MetadataDisplay metadata={metadata} />}
          </div>
        </div>
      </div>
    </div>
  );
}
