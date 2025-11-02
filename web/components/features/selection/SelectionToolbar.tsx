"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Trash2, FolderSymlink, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useImageSelectionStore } from "@/stores/useImageSelectionStore";

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
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-auto max-w-lg"
          exit={{ y: 100, opacity: 0 }}
          initial={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <Card
            className="bg-neutral-800 border border-neutral-700 text-white"
            shadow="lg"
          >
            <CardBody className="flex flex-row items-center justify-between gap-4 px-4 py-2">
              <span className="text-sm font-medium whitespace-nowrap">
                {selectedCount} {selectedCount === 1 ? "image" : "images"}{" "}
                selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  isDisabled
                  color="primary"
                  size="sm"
                  startContent={<FolderSymlink size={16} />}
                  variant="light"
                  onPress={handleMoveSelected}
                >
                  Move to...
                </Button>
                <Button
                  isDisabled
                  color="danger"
                  size="sm"
                  startContent={<Trash2 size={16} />}
                  variant="light"
                  onPress={handleDeleteSelected}
                >
                  Delete
                </Button>
                <Button
                  isIconOnly
                  aria-label="Clear selection"
                  className="ml-2 text-neutral-400 hover:text-white"
                  size="sm"
                  variant="light"
                  onPress={clearSelection}
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
