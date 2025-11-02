import { useQuery } from "@tanstack/react-query";
import { useDisclosure } from "@heroui/react";
import { useEffect } from "react";

import { getAllBatchesOptions } from "@/lib/api/queries";
import { client } from "@/client/client.gen";

export function useProjectGallery() {
  const {
    isOpen: isModalOpen,
    onOpen: onOpenModal,
    onClose: onCloseModal,
  } = useDisclosure();

  // Configure API client on mount (client-side only)
  useEffect(() => {
    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    client.setConfig({ baseUrl: API_BASE_URL });
  }, []);

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
