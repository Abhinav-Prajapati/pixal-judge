'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ImageResponse } from '@/client/types.gen';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { ImageCard } from '@/components/ui/ImageCard';
import { ClusteringToolbox } from '@/components/ui/ClusteringToolbox';
import { Card } from '@heroui/card';
import {
  Tabs,
  Tab,
} from "@heroui/react";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

function ImageGrid({ images }: { images: ImageResponse[] }) {
  if (!images || images.length === 0) {
    return <p className="text-base-content/60">No images to display.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 ">
      {images.map((image) => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
}

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

  return (
    <>
      <div className="flex flex-row gap-4 h-full w-full overflow-hidden">
        {/* Sidebar */}
        <div className="flex flex-col gap-4 w-64 h-screen flex-shrink-0">
          <ClusteringToolbox batchId={batchId} />
        </div>

        {/* Image Grid */}
        <div className="flex-grow border">
          <Tabs aria-label="Image views " >
            <Tab key="all" title={`All Images (${allImages.length})`}>
              <Card className='p-4 overflow-y-auto h-[87vh]'>
                <ImageGrid images={allImages} />
              </Card>
            </Tab>
            <Tab key="grouped" title="Grouped View">
              <Card>
                <div className="flex flex-col gap-6 p-4 overflow-y-auto h-[87vh]">
                  {clusterEntries.map(([clusterId, images]) => (
                    <section key={clusterId}>
                      <h2 className="mb-3 text-lg font-bold">
                        {clusterId}
                        <span className="ml-2 text-sm font-normal text-default-500">({images.length})</span>
                      </h2>
                      <ImageGrid images={images} />
                    </section>
                  ))}
                </div>
              </Card>
            </Tab>
          </Tabs>
        </div>
      </div>
    </>
  );
}