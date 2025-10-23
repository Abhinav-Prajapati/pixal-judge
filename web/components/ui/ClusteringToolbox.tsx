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
  const [minClusterSize, setMinClusterSize] = useState(5);
  const [minSamples, setMinSamples] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clusterMutation = useMutation({
    ...analyzeBatchMutation(),
    onSuccess: () => {
      toast.success('Clustering analysis started!');
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
    },
    onError: (error: any) => {
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object') {
        if ('detail' in error && Array.isArray(error.detail) && error.detail.length > 0) {
          errorMessage = error.detail[0].msg;
        } else if ('message' in error) {
          errorMessage = error.message;
        }
      }
      toast.error(`Clustering failed: ${errorMessage}`);
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
    onError: (error: any) => {
      let errorMessage = 'An unknown error occurred';
      if (error && typeof error === 'object') {
        if ('detail' in error && Array.isArray(error.detail) && error.detail.length > 0) {
          errorMessage = error.detail[0].msg;
        } else if ('message' in error) {
          errorMessage = error.message;
        }
      }
      toast.error(`Upload failed: ${errorMessage}`);
    },
  });

  const handleCluster = () => {
    clusterMutation.mutate({
      path: { batch_id: batchId },
      body: {
        min_cluster_size: minClusterSize,
        min_samples: minSamples,
        metric: "cosine",
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
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isBusy}
          />

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

          <div className="border-b border-default-200 my-2" />

          <h3 className="text-base font-semibold text-default-700">Tune Cluster (HDBSCAN)</h3>

          <Slider
            label={`Min Cluster Size: ${minClusterSize}`}
            value={minClusterSize}
            onChange={(value) => setMinClusterSize(value as number)}
            maxValue={50}
            minValue={1}
            step={1}
            isDisabled={isBusy}
          />

          <Slider
            label={`Min Samples: ${minSamples}`}
            value={minSamples}
            onChange={(value) => setMinSamples(value as number)}
            maxValue={50}
            minValue={1}
            step={1}
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