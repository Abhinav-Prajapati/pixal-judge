import { useState, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Spinner,
} from "@heroui/react";

import {
  getAllImagesOptions,
  createBatchMutation,
  getAllBatchesQueryKey,
} from "@/lib/api/queries";
import { siteConfig } from "@/config/site";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(
    new Set(),
  );
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reactQueryClient = useQueryClient();

  const { data: allImages = [], isLoading: isLoadingImages } = useQuery(
    getAllImagesOptions(),
  );

  const createProject = useMutation(createBatchMutation());

  // Only validate project name
  const isFormInvalid = !projectName.trim();

  const handleImageSelect = (imageId: number) => {
    setSelectedImageIds((prev) => {
      const newSet = new Set(prev);

      newSet.has(imageId) ? newSet.delete(imageId) : newSet.add(imageId);

      return newSet;
    });
  };

  const resetState = () => {
    setProjectName("");
    setSelectedImageIds(new Set());
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return setError("Please provide a project name.");
    setError(null);

    createProject.mutate(
      {
        body: { name: projectName, image_ids: Array.from(selectedImageIds) },
      },
      {
        onSuccess: () => {
          reactQueryClient.invalidateQueries({
            queryKey: getAllBatchesQueryKey(),
          });
          handleClose();
        },
        onError: (err) => {
          const apiError = err as any;
          const message =
            apiError?.detail?.[0]?.msg ||
            apiError?.message ||
            "Failed to create project.";

          setError(`${message} Please try again.`);
          console.error(err);
        },
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      radius="none"
      scrollBehavior="inside"
      size="3xl"
      onClose={handleClose}
    >
      <ModalContent className="bg-neutral-900 text-white">
        <ModalHeader>Create New Project</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <Input
              isRequired
              isDisabled={createProject.isPending}
              label="Project Name"
              radius="none"
              type="text"
              value={projectName}
              variant="bordered"
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div className="space-y-2">
              <p>Select Images ({selectedImageIds.size} selected)</p>
              <div className="border-2 border-neutral-700 rounded-lg p-2 bg-neutral-800 max-h-80 overflow-y-auto">
                {isLoadingImages ? (
                  <div className="flex justify-center p-4">
                    <Spinner />
                  </div>
                ) : allImages.length === 0 ? (
                  <p className="text-center text-neutral-500 p-4">
                    No images found. Upload images first.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {allImages.map((img) => (
                      <div
                        key={img.id}
                        className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${selectedImageIds.has(img.id) ? "border-blue-500" : "border-transparent"} ${createProject.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() =>
                          !createProject.isPending && handleImageSelect(img.id)
                        }
                      >
                        <img
                          alt={img.original_filename}
                          className="h-full w-full object-cover"
                          src={siteConfig.urls.imageThumbnail(img.id)}
                        />
                        {selectedImageIds.has(img.id) && (
                          <div className="absolute inset-0 bg-black/50" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              isDisabled={createProject.isPending}
              radius="none"
              variant="light"
              onPress={handleClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              radius='none'
              type="submit"
              isLoading={createProject.isPending}
              // Re-added validation to isDisabled
              isDisabled={isFormInvalid || isLoadingImages || createProject.isPending}
            >
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
