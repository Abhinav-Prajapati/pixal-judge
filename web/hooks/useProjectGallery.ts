import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@heroui/react";

import { getAllBatchesOptions } from "@/lib/api/queries";

export function useProjectGallery() {
  const {
    isOpen: isModalOpen,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();

  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery(getAllBatchesOptions());

  return {
    projects,
    isLoadingProjects,
    projectsError,
    isModalOpen,
    onOpenModal,
    onCloseModal,
  };
}
