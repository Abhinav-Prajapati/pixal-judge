'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { GetImageMetadataError, ImageResponse, Metadata } from '@/client/types.gen';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { ImageCard } from '@/components/ui/ImageCard';
import { ClusteringToolbox } from '@/components/ui/ClusteringToolbox';
import { Card } from '@heroui/card';
import { Button, ButtonGroup } from "@heroui/react";
import { Grid, LayoutGrid, X } from 'lucide-react'; // Import X for close icon
import { siteConfig } from '@/config/site';
import { getImageMetadata } from '@/client';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

// -----------------------------------------------------------------
// 1. ImageGrid Component
// -----------------------------------------------------------------
/**
 * Accepts an onImageClick prop to make images selectable.
 */
function ImageGrid({ images, onImageClick }: {
  images: ImageResponse[];
  onImageClick: (image: ImageResponse) => void;
}) {
  if (!images || images.length === 0) {
    return <p className="text-base-content/60">No images to display.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 ">
      {images.map((image) => (
        // Wrap ImageCard in a clickable div
        <div
          key={image.id}
          onClick={() => onImageClick(image)} // <-- Call handler on click
          className="cursor-pointer transition-transform duration-150 ease-in-out hover:scale-[1.02]"
        >
          <ImageCard image={image} />
        </div>
      ))}
    </div>
  );
}

// -----------------------------------------------------------------
// 2. ImageDetailPanel Component (Corrected)
// -----------------------------------------------------------------
/**
 * A new sticky panel to display selected image details.
 */

function ImageDetailPanel({
  image,
  onClose,
}: {
  image: ImageResponse;
  onClose: () => void;
}) {
  const imageUrl = siteConfig.urls.image(image.id);

  // --- FETCH METADATA ---
  const {
    data: metadata,
    isLoading,
    isError,
  } = useQuery<Metadata, GetImageMetadataError>({
    queryKey: ["imageMetadata", image.id],

    // --- THIS IS THE FIX ---
    // Use an async function to 'await' the result,
    // and then return *only* the 'data' property.
    queryFn: async () => {
      const response = await getImageMetadata({
        path: { image_id: image.id },
        throwOnError: true,
      });
      return response.data; // <-- Return the data, not the whole response
    },
    // ---

    enabled: !!image.id,
  });
  // ---

  return (
    // Panel container
    <div className="flex flex-col w-98 flex-shrink-0 h-screen sticky top-0 border-l border-default-200 bg-content1">
      {/* Panel Header */}
      <div className="flex flex-shrink-0 items-center justify-between p-2 border-b border-default-200">
        <h2 className="text-lg font-semibold">{image.original_filename}</h2>
        <Button
          variant="light"
          color="default"
          onPress={onClose}
          isIconOnly
          aria-label="Close panel"
        >
          <X size={20} />
        </Button>
      </div>

      {/* Panel Content (Scrollable) */}
      <div className="flex-grow overflow-y-auto">
        {/* Image on top */}
        <div className="bg-black p-4">
          <img
            src={imageUrl}
            alt={image.filename}
            className="w-full h-auto object-contain max-h-96"
          />
        </div>

        {/* Information at bottom */}
        <div className="p-4">
          <h3 className="font-semibold mb-2 text-default-800">
            Base Information
          </h3>
          <pre className="text-xs bg-default-100 p-3 rounded-md overflow-x-auto text-default-700">
            {JSON.stringify(image, null, 2)}
          </pre>

          {/* --- DISPLAY METADATA --- */}
          <h3 className="font-semibold mt-4 mb-2 text-default-800">
            Detailed Metadata
          </h3>
          <div className="text-xs bg-default-100 p-3 rounded-md overflow-x-auto text-default-700">
            {isLoading && <p>Loading metadata...</p>}
            {isError && <p className="text-danger">Failed to load metadata.</p>}
            {metadata && (
              // You can format this better, but <pre> works for now
              <pre>{JSON.stringify(metadata, null, 2)}</pre>
            )}
          </div>
          {/* --- */}
        </div>
      </div>
    </div>
  );
}


// -----------------------------------------------------------------
// 3. UPDATED BatchImagesPage Component
// -----------------------------------------------------------------
export default function BatchImagesPage() {
  const params = useParams();
  const batchId = Number(params.batchId);
  const [view, setView] = useState<'all' | 'grouped'>('all');

  // --- New state for selected image ---
  const [selectedImage, setSelectedImage] = useState<ImageResponse | null>(null);

  // --- New handlers for state ---
  const handleImageClick = useCallback((image: ImageResponse) => {
    setSelectedImage(image);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedImage(null);
  }, []);


  const { data: batch, isLoading, isError, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];
    return batch.image_associations.map(assoc => assoc.image);
  }, [batch]);

  const clusterEntries = useMemo(() => {
    if (!batch?.image_associations) return [];
    const clusters = batch.image_associations.reduce((acc, assoc) => {
      const { image, group_label } = assoc;
      const key = group_label ?? 'Ungrouped';
      if (!acc[key]) acc[key] = [];
      acc[key].push(image);
      return acc;
    }, {} as Record<string, ImageResponse[]>);
    const unsortedEntries = Object.entries(clusters);
    unsortedEntries.sort(([, imagesA], [, imagesB]) => imagesB.length - imagesA.length);
    return unsortedEntries;
  }, [batch]);

  // --- No changes to loading/error states ---
  if (isNaN(batchId)) {
    return (
      <div className="flex items-center justify-center h-full text-error">
        <p>Invalid Batch ID provided in the URL.</p>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading images for Batch {batchId}...</p>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-error">
        <p>Could not fetch batch data: {error.message}</p>
      </div>
    );
  }
  if (!batch) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Batch {batchId}</h1>
        <div className="flex items-center justify-center h-48 rounded-md bg-base-200">
          <p className="text-base-content/60">This batch contains no images.</p>
        </div>
      </div>
    );
  }

  // --- Updated Layout ---
  return (
    <>
      <div className="flex flex-row w-full">
        {/* Sidebar */}
        <div className="flex flex-col w-64 h-screen sticky top-0 flex-shrink-0">
          <ClusteringToolbox batchId={batchId} />
        </div>

        {/* Image Grid Area (takes up remaining space) */}
        <div className="flex flex-col flex-grow min-w-0"> {/* min-w-0 is important for flex-grow */}
          {/* View Switcher Nav */}
          <nav className="flex flex-shrink-0 items-center gap-2 p-2 bg-content1 border-b border-default-200 sticky top-0 z-10 justify-end">
            <ButtonGroup>
              <Button
                variant={view === 'all' ? 'solid' : 'bordered'}
                color="primary"
                onPress={() => setView('all')}
                startContent={<Grid size={18} />}
              >
                All Images ({allImages.length})
              </Button>
              <Button
                variant={view === 'grouped' ? 'solid' : 'bordered'}
                color="primary"
                onPress={() => setView('grouped')}
                startContent={<LayoutGrid size={18} />}
              >
                Grouped View
              </Button>
            </ButtonGroup>
          </nav>

          {/* Page Content Area */}
          <div className="flex-grow p-4">
            {view === 'all' && (
              <ImageGrid
                images={allImages}
                onImageClick={handleImageClick} // <-- Pass handler
              />
            )}
            {view === 'grouped' && (
              <div className="flex flex-col gap-6">
                {clusterEntries.map(([clusterId, images]) => (
                  <section key={clusterId}>
                    <h2 className="mb-3 text-lg font-bold">
                      {clusterId}
                      <span className="ml-2 text-sm font-normal text-default-500">({images.length})</span>
                    </h2>
                    <ImageGrid
                      images={images}
                      onImageClick={handleImageClick} // <-- Pass handler
                    />
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NEW: Conditionally render the detail panel */}
        {selectedImage && (
          <ImageDetailPanel
            image={selectedImage}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </>
  );
}