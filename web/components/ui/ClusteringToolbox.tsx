'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeBatchMutation, getBatchQueryKey } from '@/client/@tanstack/react-query.gen';
import {
  Accordion,
  AccordionItem,
  Slider,
  NumberInput,
  Button,
} from "@heroui/react";
import toast from 'react-hot-toast';

interface ClusteringToolboxProps {
  batchId: number;
}

export function ClusteringToolbox({ batchId }: ClusteringToolboxProps) {
  const queryClient = useQueryClient();
  const [sensitivity, setSensitivity] = useState(0.4);
  const [minImages, setMinImages] = useState(1);

  const mutation = useMutation({
    ...analyzeBatchMutation(),
    onSuccess: () => {
      toast.success('Clustering analysis started!');
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } })
      });
    },
    onError: (error) => {
      toast.error(`Clustering failed: ${error.message}`);
    },
  });

  const handleCluster = () => {
    mutation.mutate({
      path: { batch_id: batchId },
      body: {
        eps: sensitivity,
        min_samples: minImages,
      },
    });
  };

  return (
    <Accordion selectionMode="multiple" defaultExpandedKeys={["1"]}>
      <AccordionItem key="1" aria-label="Tune Cluster" title="Tune Cluster">
        <div className="flex flex-col gap-4">
          <Slider
            label="Cluster sensitivity"
            value={sensitivity}
            onChange={(value) => setSensitivity(value as number)}
            maxValue={1}
            minValue={0}
            step={0.02}
            isDisabled={mutation.isPending}
          />
          <NumberInput
            size='sm'
            variant="bordered"
            label="Min images per cluster"
            value={minImages}
            onValueChange={setMinImages}
            minValue={1}
            isDisabled={mutation.isPending}
          />
          <Button
            color="primary"
            variant="bordered"
            onPress={handleCluster}
            isLoading={mutation.isPending}
          >
            {mutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </AccordionItem>
      <AccordionItem key="2" aria-label="Accordion 2" title="Accordion 2">
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
      </AccordionItem>
      <AccordionItem key="3" aria-label="Accordion 3" title="Accordion 3">
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
      </AccordionItem>
    </Accordion>
  );
}