"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { useBatchStore } from "../store/useBatchStore";
import toast from 'react-hot-toast';

function RenameModal({ batchName, onSave }: { batchName: string; onSave: (newName: string) => void; }) {
  const [name, setName] = useState(batchName);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setName(batchName);
  }, [batchName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
      dialogRef.current?.close();
    }
  };

  return (
    <dialog id="rename_modal" ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Rename Batch</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control py-4">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" autoFocus />
          </div>
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => dialogRef.current?.close()}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

function DeleteModal({ batchName, onDelete }: { batchName: string; onDelete: () => void; }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const handleDelete = () => {
    onDelete();
    dialogRef.current?.close();
  };
  return (
    <dialog id="delete_modal" ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Delete Batch</h3>
        <p className="py-4">Are you sure you want to delete **{batchName}**? This action cannot be undone.</p>
        <div className="modal-action">
          <button className="btn" onClick={() => dialogRef.current?.close()}>Cancel</button>
          <button className="btn btn-error" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}

export function NavBar() {
  const { batch, loading, renameBatch, deleteBatch } = useBatchStore();
  const router = useRouter();

  const handleGoToBatches = () => {
    router.push('/batches');
  };

  const handleRenameConfirm = async (newName: string) => {
    const success = await renameBatch(newName);
    if (success) {
      toast.success("Batch renamed successfully!");
    } else {
      toast.error("Failed to rename batch.");
    }
  };

  const handleDeleteConfirm = async () => {
    const success = await deleteBatch();
    if (success) {
      toast.success("Batch deleted successfully!");
      router.push('/batches');
    } else {
      toast.error("Failed to delete batch.");
    }
  };

  const showModal = (id: string) => {
    (document.getElementById(id) as HTMLDialogElement)?.showModal();
  };

  if (!batch && !loading) return null;

  return (
    <>
      <div className="pl-2 pt-1">
        <details className="dropdown">
          <summary className="btn m-1 flex items-center gap-2 rounded-full">
            <ChevronDown className="w-4 h-4" />
            {loading ? "Loading..." : batch?.batch_name || "Unnamed Project"}
          </summary>
          <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow-sm">
            <li><button onClick={handleGoToBatches}><ArrowLeft className="w-4 h-4 mr-2" /> All Batches</button></li>
            <li><button onClick={() => showModal('rename_modal')}><Edit3 className="w-4 h-4 mr-2" /> Rename</button></li>
            <li><button className="text-error" onClick={() => showModal('delete_modal')}><Trash2 className="w-4 h-4 mr-2" /> Delete</button></li>
          </ul>
        </details>
      </div>

      {batch && (
        <>
          <RenameModal
            batchName={batch.batch_name}
            onSave={handleRenameConfirm}
          />
          <DeleteModal
            batchName={batch.batch_name}
            onDelete={handleDeleteConfirm}
          />
        </>
      )}
    </>
  );
}