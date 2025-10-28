'use client';

import React from 'react';
import { useImageSelectionStore } from '@/stores/useImageSelectionStore';
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Trash2, FolderSymlink, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function SelectionToolbar() {
  const { selectedImageIds, clearSelection } = useImageSelectionStore();
  const selectedCount = selectedImageIds.size;

  // TODO: Implement actual delete/move logic
  const handleDeleteSelected = () => {
    const ids = Array.from(selectedImageIds);
    console.log("Delete images:", ids);
    // Placeholder for calling deleteImageMutation for each ID
    alert(`Would delete ${ids.length} images.`);
    // clearSelection(); // Optionally clear after action
  };

  const handleMoveSelected = () => {
    const ids = Array.from(selectedImageIds);
    console.log("Move images:", ids);
    // Placeholder for opening a modal to select a target batch
    alert(`Would move ${ids.length} images.`);
    // clearSelection(); // Optionally clear after action
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-lg"
        >
          <Card shadow='lg' className="bg-neutral-800 border border-neutral-700 text-white">
            <CardBody className="flex flex-row items-center justify-between gap-4 px-4 py-2">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedCount} {selectedCount === 1 ? 'image' : 'images'} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="light"
                  color="primary"
                  onPress={handleMoveSelected}
                  startContent={<FolderSymlink size={16} />}
                  isDisabled
                >
                  Move to...
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={handleDeleteSelected}
                  startContent={<Trash2 size={16} />}
                  isDisabled
                >
                  Delete
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={clearSelection}
                  aria-label="Clear selection"
                  className='ml-2 text-neutral-400 hover:text-white'
                >
                  <X size={18} />
                </Button>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}