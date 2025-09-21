"use client";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Chip,
  Spinner,
  useDisclosure
} from "@heroui/react";
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient
} from '@tanstack/react-query';

import { client } from '@/client/client.gen';
import {
  getAllBatchesOptions,
  createBatchMutation,
  getAllImagesOptions,
  getAllBatchesQueryKey
} from '../../client/@tanstack/react-query.gen';

// Define API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({
  baseUrl: API_BASE_URL
});

// Initialize Query Client
const queryClient = new QueryClient();

// --- SVG ICONS ---
// Using self-contained SVG components for icons to keep dependencies low.
const FilterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M3 4h18v2H3V4zm2 7h14v2H5v-2zm2 7h10v2H7v-2z" fill="currentColor" />
  </svg>
);

const ProjectPlaceholderIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M17 10.5V7c0-1.66-1.34-3-3-3H5c-1.66 0-3 1.34-3 3v10c0 1.66 1.34 3 3 3h7c1.66 0 3-1.34 3-3v-3.5l4 4v-11l-4 4z" fill="currentColor" />
  </svg>
);

const MoreIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg aria-hidden="true" fill="none" focusable="false" height="1em" role="presentation" viewBox="0 0 24 24" width="1em" {...props}>
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor" />
  </svg>
);


// --- CREATE PROJECT MODAL ---
function CreateProjectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const reactQueryClient = useQueryClient();

  const { data: allImages = [], isLoading: isLoadingImages } = useQuery(getAllImagesOptions());
  const createProject = useMutation(createBatchMutation());

  const handleImageSelect = (imageId: number) => {
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      newSet.has(imageId) ? newSet.delete(imageId) : newSet.add(imageId);
      return newSet;
    });
  };

  const resetState = () => {
    setProjectName('');
    setSelectedImageIds(new Set());
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Please provide a project name.");
      return;
    }
    if (selectedImageIds.size === 0) {
      setError("Please select at least one image.");
      return;
    }
    setError(null);

    createProject.mutate({
      body: { name: projectName, image_ids: Array.from(selectedImageIds) }
    }, {
      onSuccess: () => {
        reactQueryClient.invalidateQueries({ queryKey: getAllBatchesQueryKey() });
        handleClose();
      },
      onError: (err) => {
        setError("Failed to create project. Please try again.");
        console.error(err);
      }
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh] bg-neutral-900 border border-neutral-700 text-white",
        header: "border-b border-neutral-700",
        footer: "border-t border-neutral-700",
        body: "py-6",
        closeButton: "text-white hover:bg-neutral-700",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-xl font-bold">Create New Project</h3>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div className="space-y-6">
              <Input
                type="text"
                label="Project Name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                variant="bordered"
                isRequired
              />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Select Images</p>
                  <Chip color="primary" variant="flat">{selectedImageIds.size} selected</Chip>
                </div>
                <div className="border-2 border-neutral-700 rounded-lg p-4 bg-neutral-800 max-h-80 overflow-y-auto">
                  {isLoadingImages ? (
                    <div className="flex justify-center p-4"><Spinner size="lg" /></div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                      {allImages.map(img => (
                        <div key={img.id} onClick={() => handleImageSelect(img.id)} className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${selectedImageIds.has(img.id) ? 'border-primary' : 'border-transparent hover:border-neutral-600'}`}>
                          <img src={`${API_BASE_URL}/images/thumbnail/${img.id}`} alt={img.original_filename} className="h-full w-full object-cover" />
                          {selectedImageIds.has(img.id) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xl">✓</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {error && <p className="text-danger text-sm">{error}</p>}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>Cancel</Button>
            <Button color="primary" type="submit" isLoading={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// --- PROJECT CARD ---
function ProjectCard({ project }: { project: any }) {
  const creationDate = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <Link href={`/batches/${project.id}`}>
      <Card
        isPressable
        className="bg-neutral-900 hover:bg-neutral-800 group transition-colors"
      >
        <CardBody className="p-4">
          <div className="flex flex-col gap-4">
            <div className="aspect-[16/9] bg-neutral-800 rounded-lg flex items-center justify-center">
              <ProjectPlaceholderIcon className="w-12 h-12 text-neutral-600" />
            </div>
            <div className="flex justify-between items-start">
              <div className="text-left">
                <p className="font-semibold text-white truncate">{project.batch_name}</p>
                <p className="text-sm text-neutral-400">Created {creationDate}</p>
              </div>
              <Button isIconOnly variant="light" size="sm" className="text-neutral-500 hover:text-white">
                <MoreIcon />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}


// --- MAIN PROJECTS PAGE COMPONENT ---
function ProjectsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: projects = [], isLoading, error } = useQuery(getAllBatchesOptions());

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center py-24"><Spinner size="lg" /></div>;
    }

    if (error) {
      return (
        <div className="bg-danger-500/10 border border-danger-500/20 text-danger-400 p-6 rounded-lg text-center mt-8">
          <h3 className="font-bold">An Error Occurred</h3>
          <p className="text-sm">Could not connect to the API. Please check your connection and try again.</p>
        </div>
      );
    }

    if (Array.isArray(projects) && projects.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {projects.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      );
    }

    // Empty state can be designed here if needed
    return (
      <div className="text-center py-24 border-2 border-dashed border-neutral-800 rounded-lg mt-8">
        <h2 className="text-xl font-bold text-white">No Projects Yet</h2>
        <p className="text-neutral-400 mt-2 mb-6">Get started by creating your first project.</p>
        <Button color="primary" size="lg" onPress={onOpen}>
          Create New Project
        </Button>
      </div>
    );
  };

  return (
    <>
      <CreateProjectModal isOpen={isOpen} onClose={onClose} />
      <div className="bg-black min-h-screen text-neutral-300">
        <div className="container mx-auto px-6 py-8">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Your Projects</h1>
              <p className="mt-1 text-neutral-400">{projects.length} project{projects.length !== 1 && 's'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="bordered" className="text-neutral-300 border-neutral-700">Select Projects</Button>
              <Button color="primary" onPress={onOpen} className="font-semibold">
                + New project
              </Button>
            </div>
          </header>

          <div className="flex items-center gap-4">
            <Input
              placeholder="Search projects..."
              variant="bordered"
              className="flex-grow"
            />
            <Button isIconOnly variant="bordered" className="text-neutral-300 border-neutral-700">
              <FilterIcon />
            </Button>
          </div>

          {renderContent()}
        </div>
      </div>
    </>
  );
}

// --- PROVIDER WRAPPER ---
export default function ProjectsPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProjectsPage />
    </QueryClientProvider>
  );
}