"use client";
import { Button } from "@heroui/button";
import { Input, Spinner } from "@heroui/react";
import { Plus, SlidersHorizontal } from 'lucide-react';

import { useProjectGallery } from '@/hooks/useProjectGallery';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { CreateProjectModal } from '@/components/features/project-gallery/CreateProjectModal';

export default function ProjectsPage() {
  const {
    projects,
    isLoadingProjects,
    projectsError,
    isModalOpen,
    onOpenModal,
    onCloseModal,
  } = useProjectGallery();

  return (
    <>
      <CreateProjectModal isOpen={isModalOpen} onClose={onCloseModal} />
      <div className="bg-black min-h-screen text-white font-sans p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-50">Your Projects</h1>
              {!isLoadingProjects && <p className="text-neutral-400 mt-1">{projects.length} projects</p>}
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-neutral-800" isDisabled radius="none">Select Projects</Button>
              <Button color="primary" onPress={onOpenModal} startContent={<Plus className="w-5 h-5" />} radius="none">
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
              isDisabled
              radius="none"
            />
            <Button isIconOnly className="bg-neutral-800" isDisabled radius="none">
              <SlidersHorizontal className="w-5 h-5 text-neutral-300" />
            </Button>
          </div>

          {isLoadingProjects ? (
            <div className="flex justify-center mt-16"><Spinner size="lg" /></div>
          ) : projectsError ? (
            <p className="text-center text-red-500 mt-16">Error: Could not fetch projects. {(projectsError as Error)?.message}</p>
          ) : projects.length === 0 ? (
            <div className="text-center mt-16 bg-neutral-900 p-8 rounded-lg">
              <h2 className="text-xl font-bold">No Projects Found</h2>
              <p className="text-neutral-400 my-4">Get started by creating your first project.</p>
              <Button color="primary" onPress={onOpenModal} radius="none">Get Started</Button>
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