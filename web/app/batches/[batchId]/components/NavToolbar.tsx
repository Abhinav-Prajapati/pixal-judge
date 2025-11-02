"use client";

import React, { useCallback } from "react";
import { Button, ButtonGroup } from "@heroui/react";
import { Grid, LayoutGrid, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";

import { useBatchViewStore } from "./useBatchViewStore";

import { useImageSelectionStore } from "@/stores/useImageSelectionStore";
import {
  removeImagesFromBatchMutation,
  getBatchQueryKey,
} from "@/client/@tanstack/react-query.gen";

export function NavToolBar({ allImagesCount }: { allImagesCount: number }) {
  const { view, setView } = useBatchViewStore();
  const { selectedImageIds, clearSelection } = useImageSelectionStore();
  const queryClient = useQueryClient();
  const params = useParams();
  const batchId = Number(params.batchId);

  const selectedCount = selectedImageIds.size;

  const removeMutation = useMutation({
    ...removeImagesFromBatchMutation(),
    onSuccess: () => {
      toast.success(
        `${selectedCount} ${
          selectedCount === 1 ? "image" : "images"
        } removed from batch.`,
      );
      // Refetch the batch data to show the images are gone
      queryClient.invalidateQueries({
        queryKey: getBatchQueryKey({ path: { batch_id: batchId } }),
      });
      // Clear the selection
      clearSelection();
    },
    onError: (error: any) => {
      toast.error(
        `Failed to remove images: ${error.message || "Unknown error"}`,
      );
    },
  });

  const handleRemoveSelected = useCallback(() => {
    if (!batchId || selectedCount === 0) return;

    const imageIds = Array.from(selectedImageIds);

    removeMutation.mutate({
      path: { batch_id: batchId },
      body: { image_ids: imageIds },
    });
  }, [batchId, selectedImageIds, removeMutation, selectedCount]);

  return (
    <nav className="flex flex-shrink-0 items-center gap-4 p-2 bg-content1 border-b border-default-200 sticky top-0 z-10 justify-between">
      {/* LEFT SIDE: Conditional Selection Controls */}
      <div className="flex items-center gap-2">
        {selectedCount > 0 && (
          <>
            <span className="text-sm font-medium text-default-600 px-2">
              {selectedCount} {selectedCount === 1 ? "image" : "images"}{" "}
              selected
            </span>
            <Button
              color="danger"
              isLoading={removeMutation.isPending}
              radius="none"
              size="sm"
              startContent={<Trash2 size={16} />}
              variant="light"
              onPress={handleRemoveSelected}
            >
              Remove
            </Button>
            <Button
              aria-label="Clear selection"
              className="text-default-500"
              radius="none"
              size="sm"
              variant="bordered"
              onPress={clearSelection}
            >
              Deselect
            </Button>
          </>
        )}
      </div>

      <ButtonGroup>
        <Button
          color="primary"
          radius="none"
          startContent={<Grid size={18} />}
          variant={view === "all" ? "solid" : "bordered"}
          onPress={() => setView("all")}
        >
          All Images ({allImagesCount})
        </Button>
        <Button
          color="primary"
          radius="none"
          startContent={<LayoutGrid size={18} />}
          variant={view === "grouped" ? "solid" : "bordered"}
          onPress={() => setView("grouped")}
        >
          Grouped View
        </Button>
      </ButtonGroup>
    </nav>
  );
}
