'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ImageResponse } from '@/client/types.gen';
import { getBatchOptions } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { ImageCard } from '@/components/ui/ImageCard';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { ArrowLeft, ChevronDown } from 'lucide-react';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

function ImageGrid({ images }: { images: ImageResponse[] }) {
  if (!images || images.length === 0) {
    return <p className="text-base-content/60">No images to display.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
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
    <div className="flex flex-col gap-4 h-full w-full p-4">
      {/* 1. Thin Navbar Column */}
      <nav className="flex flex-shrink-0 items-center gap-2">
        <Button size="md" isIconOnly >
          <ArrowLeft />
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="bordered">{batch.batch_name} <ChevronDown size={18} /> </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Static Actions">
            <DropdownItem key="new">Rename</DropdownItem>
            <DropdownItem key="delete" className="text-danger" color="danger">
              Delete Batch
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </nav>

      {/* 2. Wrapper for Sidebar and Main Content that takes remaining space */}
      <div className="flex flex-row gap-4 flex-grow">
        {/* Sidebar */}
        <Card className="py-4 w-64 flex-shrink-0">
          <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
            <p className="text-tiny uppercase font-bold">Batch Details</p>
            <h4 className="font-bold text-large">{batch.batch_name}</h4>
            <small className="text-default-500">{allImages.length} images</small>
          </CardHeader>
          <CardBody className="overflow-visible py-2">
            {/* ... Add other sidebar content here ... */}
          </CardBody>
        </Card>

        {/* Main Content Area that grows and scrolls */}
        <div className="flex-grow overflow-y-auto">
          <Card className='p-4'>
            <ImageGrid images={allImages} />
          </Card>
        </div>
      </div>
    </div>
  );
}