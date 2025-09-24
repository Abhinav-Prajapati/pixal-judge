'use client';

import React, { useMemo, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ImageResponse } from '@/client/types.gen';
import { getBatchOptions, renameBatchMutation, deleteBatchMutation } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { ImageCard } from '@/components/ui/ImageCard';
import { Card, CardBody, CardHeader } from '@heroui/card';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  useDisclosure,
  Tabs,
  Tab,
} from "@heroui/react";
import { ArrowLeft, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

// --- Helper Components ---

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


// --- Main Page Component ---

export default function BatchImagesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const batchId = Number(params.batchId);

  const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

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
      <div className="flex flex-col gap-4 h-full w-full p-4">
        {/* 1. Top Navbar */}
        <nav className="flex flex-shrink-0 items-center gap-2">
          <Button size="md" isIconOnly onPress={() => router.back()} >
            <ArrowLeft />
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="bordered">{batch.batch_name} <ChevronDown size={18} /> </Button>
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

        {/* 2. Wrapper for Sidebar and Main Content */}
        <div className="flex flex-row gap-4 flex-grow overflow-hidden">
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

          {/* Main Content Area */}
          <div className="flex-grow overflow-y-auto">
            <Tabs aria-label="Image views">
              <Tab key="all" title={`All Images (${allImages.length})`}>
                <Card className='p-4'>
                  <ImageGrid images={allImages} />
                </Card>
              </Tab>
              <Tab key="grouped" title="Grouped View">
                <Card className='p-4'>
                  <div className="flex flex-col gap-6">
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
      </div>

      {/* Modals */}
      <RenameModal
        batchName={batch.batch_name}
        onSave={handleRenameConfirm}
        isPending={renameMutation.isPending}
        isOpen={isRenameOpen}
        onClose={onRenameClose}
      />
      <DeleteModal
        batchName={batch.batch_name}
        onDelete={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
      />
    </>
  );
}

