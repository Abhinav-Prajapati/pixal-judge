// File: app/batches/[batchId]/components/ConfirmModal.tsx
"use client";

export function ConfirmModal({ modalId, title, message, onConfirm }: { 
  modalId: string; 
  title: string; 
  message: string; 
  onConfirm: () => void; 
}) {
  return (
    <dialog id={modalId} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
        <div className="modal-action">
          <form method="dialog" className='space-x-2'>
            <button className="btn">Cancel</button>
            <button className="btn btn-error" onClick={onConfirm}>Confirm</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}