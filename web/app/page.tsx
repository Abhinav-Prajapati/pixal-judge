"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@heroui/button";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Spinner } from "@heroui/react";
import { Plus, SlidersHorizontal, Video, Calendar } from 'lucide-react';

import { client } from '@/client/client.gen';
// Assuming 'Batch' is the type for a single project/batch object from your generated types
import type { BatchResponse } from '../client/types.gen';
import {
  getAllBatchesOptions,
  createBatchMutation,
  getAllImagesOptions,
  getAllBatchesQueryKey
} from '../client/@tanstack/react-query.gen';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

// Define props interface for type safety
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(new Set());
  const [projectName, setProjectName] = useState('');
  // Explicitly type the error state to allow string or null
  const [error, setError] = useState<string | null>(null);
  const reactQueryClient = useQueryClient();

  const { data: allImages = [], isLoading: isLoadingImages } = useQuery(getAllImagesOptions());
  const createProject = useMutation(createBatchMutation());

  // Type the imageId parameter
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

  // Type the form event parameter
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return setError("Please provide a project name.");
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
    <Modal isOpen={isOpen} onClose={handleClose} size="3xl" scrollBehavior="inside">
      <ModalContent className="bg-neutral-900 text-white">
        <ModalHeader>Create New Project</ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody className="space-y-4">
            <Input
              type="text"
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              variant="bordered"
              isRequired
            />
            <div className="space-y-2">
              <p>Select Images ({selectedImageIds.size} selected)</p>
              <div className="border-2 border-neutral-700 rounded-lg p-2 bg-neutral-800 max-h-80 overflow-y-auto">
                {isLoadingImages ? (
                  <div className="flex justify-center p-4"><Spinner /></div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {allImages.map(img => (
                      <div
                        key={img.id}
                        onClick={() => handleImageSelect(img.id)}
                        className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${selectedImageIds.has(img.id) ? 'border-blue-500' : 'border-transparent'}`}
                      >
                        <img src={`${API_BASE_URL}/images/thumbnail/${img.id}`} alt={img.original_filename} className="h-full w-full object-cover" />
                        {selectedImageIds.has(img.id) && <div className="absolute inset-0 bg-black/50" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleClose}>Cancel</Button>
            <Button color="primary" type="submit" isLoading={createProject.isPending}>
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// Define props interface for type safety
interface ProjectCardProps {
  project: BatchResponse;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const previewImages = project.image_associations.slice(0, 4);
  const totalImages = project.image_associations.length;
  return (
    <Link href={`/batches/${project.id}`}>
      <Card isPressable isHoverable className="bg-neutral-900 border border-neutral-800 hover:border-blue-500">
        <CardHeader className="aspect-video bg-neutral-800 flex items-center justify-center">
          <div className="relative w-44 h-44 flex-shrink-0 group flex items-center justify-center">
            {/* Type the map parameters */}
            {previewImages.map((assoc, index: number) => {
              const offset = index * 20;
              const scale = 1 - (index * 0.05);
              const brightnessClasses = ['brightness-100', 'brightness-90', 'brightness-75'];

              return (
                <div
                  key={assoc.image.id}
                  className={`absolute w-28 h-40 rounded-sm overflow-hidden bg-neutral-800 shadow-lg ${brightnessClasses[index]}`}
                  style={{
                    left: `${offset}px`,
                    transform: `scale(${scale})`,
                    zIndex: 3 - index,
                  }}
                >
                  <img
                    src={`${API_BASE_URL}/images/thumbnail/${assoc.image.id}`}
                    alt="Project image preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}

            {previewImages.length > 0 && Array.from({ length: Math.max(0, 4 - previewImages.length) }).map((_, i) => {
              const index = previewImages.length + i;
              const offset = index * 20;
              const scale = 1 - (index * 0.05);

              return (
                <div
                  key={`placeholder-${index}`}
                  className="absolute w-28 h-40 rounded-sm bg-neutral-800/50 border-2 border-dashed border-neutral-700"
                  style={{
                    left: `${offset}px`,
                    transform: `scale(${scale})`,
                    zIndex: 3 - index,
                  }}
                />
              );
            })}

            {previewImages.length === 0 && (
              <div className="absolute w-28 h-40 rounded-lg flex items-center justify-center text-center text-sm text-neutral-500 bg-neutral-800 border-2 border-dashed border-neutral-700">
                No Images
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-neutral-100">{project.batch_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-neutral-500" />
                <p className="text-sm text-neutral-500">Contains {project.image_associations.length} images</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};

export default function ProjectsPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: projects = [], isLoading, error } = useQuery(getAllBatchesOptions());

  return (
    <>
      <CreateProjectModal isOpen={isOpen} onClose={onClose} />
      <div className="bg-black min-h-screen text-white font-sans p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-50">Your Projects</h1>
              {!isLoading && <p className="text-neutral-400 mt-1">{projects.length} projects</p>}
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-neutral-800">Select Projects</Button>
              <Button color="primary" onPress={onOpen} startContent={<Plus className="w-5 h-5" />}>
                New project
              </Button>
            </div>
          </header>

          <div className="mt-8 flex items-center justify-between gap-4">
            <Input
              type="text"
              placeholder="Search projects..."
              className="w-full max-w-sm"
              classNames={{ inputWrapper: "bg-neutral-800 border-neutral-700" }}
            />
            <Button isIconOnly className="bg-neutral-800">
              <SlidersHorizontal className="w-5 h-5 text-neutral-300" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center mt-16"><Spinner size="lg" /></div>
          ) : error ? (
            <p className="text-center text-red-500 mt-16">Error: Could not fetch projects.</p>
          ) : projects.length === 0 ? (
            <div className="text-center mt-16 bg-neutral-900 p-8 rounded-lg">
              <h2 className="text-xl font-bold">No Projects Found</h2>
              <p className="text-neutral-400 my-4">Get started by creating your first project.</p>
              <Button color="primary" onPress={onOpen}>Get Started</Button>
            </div>
          ) : (
            <main className="mt-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {projects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </main>
          )}
        </div>
      </div>
    </>
  );
}