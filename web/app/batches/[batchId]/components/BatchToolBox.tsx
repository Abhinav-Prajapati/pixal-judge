"use client";

import React, { useState, useRef, ChangeEvent, FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Slider,
  Button,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
} from "@heroui/react";
import toast from "react-hot-toast";
import { ArrowLeft, Pencil, Trash2, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import {
  analyzeBatchMutation,
  uploadAndAddImagesToBatchMutation,
  getBatchQueryKey,
  getBatchOptions,
  renameBatchMutation,
  deleteBatchMutation,
} from "@/client/@tanstack/react-query.gen";

interface ClusteringToolboxProps {
  batchId: number;
}

export function BatchToolBox({ batchId }: ClusteringToolboxProps) {
  const queryClient = useQueryClient();
  const [minClusterSize, setMinClusterSize] = useState(5);
  const [minSamples, setMinSamples] = useState(5);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const {
    data: batch,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...getBatchOptions({ path: { batch_id: batchId } }),
    enabled: !isNaN(batchId),
  });

  const clusterMutation = useMutation({
    ...analyzeBatchMutation(),
    onSuccess: () => {
      toast.success("Clustering analysis started!");
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
    },
    onError: (error: any) => {
      let errorMessage = "An unknown error occurred";

      if (error && typeof error === "object") {
        if (
          "detail" in error &&
          Array.isArray(error.detail) &&
          error.detail.length > 0
        ) {
          errorMessage = error.detail[0].msg;
        } else if ("message" in error) {
          errorMessage = error.message;
        }
      }
      toast.error(`Clustering failed: ${errorMessage}`);
    },
  });

  const uploadMutation = useMutation({
    ...uploadAndAddImagesToBatchMutation(),
    onSuccess: () => {
      toast.success("Images uploaded and added to batch!");
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      let errorMessage = "An unknown error occurred";

      if (error && typeof error === "object") {
        if (
          "detail" in error &&
          Array.isArray(error.detail) &&
          error.detail.length > 0
        ) {
          errorMessage = error.detail[0].msg;
        } else if ("message" in error) {
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

  const {
    isOpen: isRenameOpen,
    onOpen: onRenameOpen,
    onClose: onRenameClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const renameMutation = useMutation({
    ...renameBatchMutation(),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["getBatch", { path: { batch_id: batchId } }],
        data,
      );
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
      queryClient.invalidateQueries({ queryKey: ["getAllBatches"] });
      router.push("/batches");
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

  function RenameModal({
    batchName,
    onSave,
    isPending,
    isOpen,
    onClose,
  }: RenameModalProps) {
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
                autoFocus
                disabled={isPending}
                label="Batch Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button disabled={isPending} variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                disabled={!name?.trim()}
                isLoading={isPending}
                type="submit"
              >
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

  function DeleteModal({
    batchName,
    onDelete,
    isPending,
    isOpen,
    onClose,
  }: DeleteModalProps) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>Delete Batch</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete <strong>{batchName}</strong>? This
              action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button disabled={isPending} variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button color="danger" isLoading={isPending} onPress={onDelete}>
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  const isBusy =
    clusterMutation.isPending ||
    uploadMutation.isPending ||
    renameMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="h-screen flex flex-col bg-content1 sticky top-0">
      <div className="flex flex-shrink-0 items-center gap-2 p-2 border-b border-r border-default-200">
        <Button
          isIconOnly
          size="md"
          variant="light"
          onPress={() => router.back()}
        >
          <ArrowLeft />
        </Button>
        <Image alt="Logo" height={24} src="/logo.png" width={32} />
        <h2 className="flex-grow px-2 text-base font-semibold text-default-700">
          {batch?.batch_name}
        </h2>
      </div>
      <div className="flex-grow overflow-y-auto p-2 pt-4 border-r border-default-200">
        <div className="flex flex-col gap-4 ">
          <input
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            disabled={isBusy}
            type="file"
            onChange={handleFileChange}
          />

          <Slider
            isDisabled={isBusy}
            label={`Min Cluster Size: ${minClusterSize}`}
            maxValue={50}
            minValue={1}
            step={1}
            value={minClusterSize}
            onChange={(value) => setMinClusterSize(value as number)}
          />

          <Slider
            isDisabled={isBusy}
            label={`Min Samples: ${minSamples}`}
            maxValue={50}
            minValue={1}
            step={1}
            value={minSamples}
            onChange={(value) => setMinSamples(value as number)}
          />

          <Button
            color="primary"
            isDisabled={isBusy}
            isLoading={clusterMutation.isPending}
            radius="none"
            variant="bordered"
            onPress={handleCluster}
          >
            {clusterMutation.isPending ? "Analyzing..." : "Analyze"}
          </Button>

          <Button
            color="primary"
            isDisabled={isBusy}
            isLoading={uploadMutation.isPending}
            radius="none"
            startContent={<UploadCloud size={18} />}
            variant="solid"
            onPress={handleUploadClick}
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload & Add Images"}
          </Button>
        </div>

        <div className="flex gap-2 justify-end bottom-0 absolute py-2">
          <Button
            disabled={isBusy}
            size="md"
            startContent={<Pencil size={18} />}
            variant="light"
            onPress={onRenameOpen}
          >
            Rename
          </Button>
          <Button
            color="danger"
            disabled={isBusy}
            size="md"
            startContent={<Trash2 size={18} />}
            variant="light"
            onPress={onDeleteOpen}
          >
            Delete
          </Button>
        </div>
      </div>
      <RenameModal
        batchName={batch?.batch_name || "Untitled Batch"}
        isOpen={isRenameOpen}
        isPending={renameMutation.isPending}
        onClose={onRenameClose}
        onSave={handleRenameConfirm}
      />
      <DeleteModal
        batchName={batch?.batch_name || "Untitled Batch"}
        isOpen={isDeleteOpen}
        isPending={deleteMutation.isPending}
        onClose={onDeleteClose}
        onDelete={handleDeleteConfirm}
      />
    </div>
  );
}
