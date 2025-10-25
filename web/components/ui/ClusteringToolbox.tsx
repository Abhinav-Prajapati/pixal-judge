'use client';

import React, { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeBatchMutation,
  uploadAndAddImagesToBatchMutation,
  getBatchQueryKey,
  getBatchOptions,
  renameBatchMutation,
  deleteBatchMutation,
} from '@/client/@tanstack/react-query.gen';
import {
  Slider,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "@heroui/react";
import { Card, CardBody } from '@heroui/card';
import toast from 'react-hot-toast';
import { ArrowLeft, ChevronDown, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ClusteringToolboxProps {
  batchId: number;
}

export function ClusteringToolbox({ batchId }: ClusteringToolboxProps) {
  const queryClient = useQueryClient();
  const [minClusterSize, setMinClusterSize] = useState(5);
  const [minSamples, setMinSamples] = useState(5);
  const [newBatchName, setNewBatchName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const { data: batch, isLoading, isError, error } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

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

  const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const renameMutation = useMutation({
    ...renameBatchMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(['getBatch', { path: { batch_id: batchId } }], data);
      toast.success("Batch renamed successfully!");
      onRenameClose();
    },
    onError: () => {
      toast.error("Failed to rename batch.");
    },
  });

  const deleteMutation = useMutation({
    ...deleteBatchMutation(),
    onSuccess: () => {
      toast.success("Batch deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['getAllBatches'] });
      router.push('/batches');
    },
    onError: () => {
      toast.error("Failed to delete batch.");
    },
  });

  const handleRenameConfirm = (newName: string) => {
    renameMutation.mutate({
      path: { batch_id: batchId },
      body: { name: newName },
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate({
      path: { batch_id: batchId },
    });
  };

  interface RenameModalProps {
    batchName: string;
    onSave: (newName: string) => void;
    isPending: boolean;
    isOpen: boolean;
    onClose: () => void;
  }

  function RenameModal({ batchName, onSave, isPending, isOpen, onClose }: RenameModalProps) {
    const [name, setName] = useState(batchName);
    const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (name.trim()) {
        onSave(name.trim());
      }
    };
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Rename Batch</ModalHeader>
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <Input
                type="text"
                label="Batch Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                disabled={isPending}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose} disabled={isPending}>Cancel</Button>
              <Button color="primary" type="submit" isLoading={isPending} disabled={!name?.trim()}>
                {isPending ? "Saving..." : "Save"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    );
  }

  interface DeleteModalProps {
    batchName: string;
    onDelete: () => void;
    isPending: boolean;
    isOpen: boolean;
    onClose: () => void;
  }

  function DeleteModal({ batchName, onDelete, isPending, isOpen, onClose }: DeleteModalProps) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Batch</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete <strong>{batchName}</strong>? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose} disabled={isPending}>Cancel</Button>
            <Button color="danger" onPress={onDelete} isLoading={isPending}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const isBusy = clusterMutation.isPending || uploadMutation.isPending || renameMutation.isPending || deleteMutation.isPending;

  return (
    <Card>
      <CardBody>
        <div className="flex flex-col gap-4">
          <nav className="flex flex-shrink-0 items-center gap-2 border">
            <Button size="md" isIconOnly onPress={() => router.back()} >
              <ArrowLeft />
            </Button>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="bordered">{batch?.batch_name} <ChevronDown size={18} /> </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Batch Actions"
                onAction={(key) => {
                  if (key === 'rename') onRenameOpen();
                  if (key === 'delete') onDeleteOpen();
                }}
              >
                <DropdownItem key="rename">Rename</DropdownItem>
                <DropdownItem key="delete" className="text-danger" color="danger">
                  Delete Batch
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </nav>
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
      <RenameModal
        batchName={batch?.batch_name || 'Untitled Batch'}
        onSave={handleRenameConfirm}
        isPending={renameMutation.isPending}
        isOpen={isRenameOpen}
        onClose={onRenameClose}
      />
      <DeleteModal
        batchName={batch?.batch_name || 'Untitled Batch'}
        onDelete={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
      />
    </Card>
  );
}