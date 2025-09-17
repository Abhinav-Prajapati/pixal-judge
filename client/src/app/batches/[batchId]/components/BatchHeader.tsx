'use client'
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Edit3, Trash2 } from "lucide-react";
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameBatchMutation, deleteBatchMutation } from "@/client/@tanstack/react-query.gen";
import type { BatchResponse } from "@/client/types.gen";

interface BatchHeaderProps {
  batch: BatchResponse;
}

export function BatchHeader({ batch }: BatchHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: renameBatchMutation().mutationFn,
    onSuccess: (data) => {
      queryClient.setQueryData(['getBatch', { path: { batch_id: batch.id } }], data);
      toast.success("Batch renamed successfully!");
      (document.getElementById('rename_modal') as HTMLDialogElement)?.close();
    },
    onError: () => {
      toast.error("Failed to rename batch.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBatchMutation().mutationFn,
    onSuccess: () => {
      toast.success("Batch deleted successfully!");
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

  const showModal = (id: string) => {
    (document.getElementById(id) as HTMLDialogElement)?.showModal();
  };

  return (
    <>
      <div className="pl-2 pt-1">
        <details className="dropdown">
          <summary className="btn m-1 flex items-center gap-2 rounded-full">
            <ChevronDown className="w-4 h-4" />
            {batch.batch_name}
          </summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm">
            <li><button onClick={handleGoToBatches}><ArrowLeft className="w-4 h-4 mr-2" /> All Batches</button></li>
            <li><button onClick={() => showModal('rename_modal')} disabled={renameMutation.isPending || deleteMutation.isPending}><Edit3 className="w-4 h-4 mr-2" /> Rename</button></li>
            <li><button className="text-error" onClick={() => showModal('delete_modal')} disabled={renameMutation.isPending || deleteMutation.isPending}><Trash2 className="w-4 h-4 mr-2" /> Delete</button></li>
          </ul>
        </details>
      </div>
      <RenameModal
        batchName={batch.batch_name}
        onSave={handleRenameConfirm}
        isPending={renameMutation.isPending}
      />
      <DeleteModal
        batchName={batch.batch_name}
        onDelete={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}

function RenameModal({ batchName, onSave, isPending }: { batchName: string; onSave: (newName: string) => void; isPending: boolean; }) {
  const [name, setName] = useState(batchName);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <dialog id="rename_modal" ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Rename Batch</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control py-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" autoFocus disabled={isPending} />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => dialogRef.current?.close()} disabled={isPending}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isPending}>Save</button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

function DeleteModal({ batchName, onDelete, isPending }: { batchName: string; onDelete: () => void; isPending: boolean; }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleDelete = () => {
    onDelete();
  };
  return (
    <dialog id="delete_modal" ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Delete Batch</h3>
        <p className="py-4">Are you sure you want to delete **{batchName}**? This action cannot be undone.</p>
        <div className="modal-action">
          <button className="btn" onClick={() => dialogRef.current?.close()} disabled={isPending}>Cancel</button>
          <button className="btn btn-error" onClick={handleDelete} disabled={isPending}>Delete</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}