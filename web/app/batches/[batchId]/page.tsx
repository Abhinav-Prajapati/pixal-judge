'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ImageResponse } from '@/client/types.gen';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { ImageCard } from '@/components/ui/ImageCard';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

// --- Updated ImageGrid Component ---
function ImageGrid({ images }: { images: ImageResponse[] }) {
  if (!images || images.length === 0) {
    return <p className="text-base-content/60">No images to display.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
}

// --- Main Page Component (Unchanged) ---
export default function BatchImagesPage() {
  const params = useParams();
  const batchId = Number(params.batchId);

  const { data: batch, isLoading, isError, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  const allImages = useMemo(() => {
    if (!batch?.image_associations) return [];
    return batch.image_associations.map(assoc => assoc.image);
  }, [batch]);

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

  if (!batch || allImages.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Batch {batch?.batch_name || batchId}</h1>
        <div className="flex items-center justify-center h-48 rounded-md bg-base-200">
          <p className="text-base-content/60">This batch contains no images.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">
        {batch.batch_name}
        <span className="text-base font-normal text-base-content/60 ml-2">({allImages.length} images)</span>
      </h1>
      <ImageGrid images={allImages} />
    </div>
  );
}

