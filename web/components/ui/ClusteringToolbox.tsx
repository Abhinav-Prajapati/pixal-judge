'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  analyzeBatchMutation,
  uploadAndAddImagesToBatchMutation,
  getBatchQueryKey,
} from '@/client/@tanstack/react-query.gen';
import {
  Slider,
  NumberInput,
  Button,
} from "@heroui/react";
import { Card, CardBody } from '@heroui/card';
import toast from 'react-hot-toast';
import { UploadCloud } from 'lucide-react';

interface ClusteringToolboxProps {
  batchId: number;
}

export function ClusteringToolbox({ batchId }: ClusteringToolboxProps) {
  const queryClient = useQueryClient();
  const [sensitivity, setSensitivity] = useState(0.4);
  const [minImages, setMinImages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clusterMutation = useMutation({
    ...analyzeBatchMutation(),
    onSuccess: () => {
      toast.success('Clustering analysis started!');
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
    },
    onError: (error) => {
      toast.error(`Clustering failed: ${error.detail}`);
    },
  });

  const uploadMutation = useMutation({
    ...uploadAndAddImagesToBatchMutation(),
    onSuccess: () => {
      toast.success('Images uploaded and added to batch!');
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.detail}`);
    },
  });

  const handleCluster = () => {
    clusterMutation.mutate({
      path: { batch_id: batchId },
      body: {
        eps: sensitivity,
        min_samples: minImages,
      },
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate({
        path: { batch_id: batchId },
        body: {
          files: Array.from(files),
        },
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isBusy = clusterMutation.isPending || uploadMutation.isPending;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4">
          {/* File input (hidden) */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isBusy}
          />

          {/* Upload Button */}
          <Button
            color="primary"
            variant="solid"
            onPress={handleUploadClick}
            isLoading={uploadMutation.isPending}
            isDisabled={isBusy}
            startContent={<UploadCloud size={18} />}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload & Add Images'}
          </Button>

          {/* Separator */}
          <div className="border-b border-default-200 my-2" />

          {/* Clustering Controls */}
          <h3 className="text-base font-semibold text-default-700">Tune Cluster</h3>
          <Slider
            label="Cluster sensitivity"
            value={sensitivity}
            onChange={(value) => setSensitivity(value as number)}
            maxValue={1}
            minValue={0}
            step={0.02}
            isDisabled={isBusy}
          />
          <NumberInput
            size='sm'
            variant="bordered"
            label="Min images per cluster"
            value={minImages}
            onValueChange={setMinImages}
            minValue={1}
            isDisabled={isBusy}
          />
          <Button
            color="primary"
            variant="bordered"
            onPress={handleCluster}
            isLoading={clusterMutation.isPending}
            isDisabled={isBusy}
          >
            {clusterMutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}