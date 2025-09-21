'use client';
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Edit3, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@heroui/react";
import { renameBatchMutation, deleteBatchMutation } from "../../../../client/@tanstack/react-query.gen";
import type { BatchResponse } from "../../../../client/types.gen";

interface BatchHeaderProps {
  batch: BatchResponse;
}

export function BatchHeader({ batch }: BatchHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isOpen: isRenameOpen, onOpen: onRenameOpen, onClose: onRenameClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const renameMutation = useMutation({
    mutationFn: renameBatchMutation().mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(['getBatch', { path: { batch_id: batch.id } }], data);
      toast.success("Batch renamed successfully!");
      onRenameClose();
    },
    onError: () => {
      toast.error("Failed to rename batch.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBatchMutation().mutationFn,
    onSuccess: () => {
      toast.success("Batch deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['getAllBatches'] });
      router.push('/batches');
    },
    onError: () => {
      toast.error("Failed to delete batch.");
    },
  });

  const handleGoToBatches = () => {
    router.push('/batches');
  };

  const handleRenameConfirm = (newName: string) => {
    renameMutation.mutate({
      path: { batch_id: batch.id },
      body: { name: newName },
    });
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate({
      path: { batch_id: batch.id },
    });
  };

  return (
    <>
      <div className="pl-4 pt-3 pb-2 border-b border-neutral-800">
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" className="text-lg font-semibold text-white">
              {batch.batch_name}
              <ChevronDown className="w-5 h-5 ml-1" />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Batch Actions"
            disabledKeys={renameMutation.isPending || deleteMutation.isPending ? ["rename", "delete"] : []}
            onAction={(key) => {
              if (key === 'all_batches') handleGoToBatches();
              if (key === 'rename') onRenameOpen();
              if (key === 'delete') onDeleteOpen();
            }}
          >
            <DropdownItem key="all_batches" startContent={<ArrowLeft className="w-4 h-4" />}>
              All Batches
            </DropdownItem>
            <DropdownItem key="rename" startContent={<Edit3 className="w-4 h-4" />}>
              Rename
            </DropdownItem>
            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<Trash2 className="w-4 h-4" />}>
              Delete
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>

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

// --- MODAL COMPONENTS ---

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

