import Link from 'next/link';
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Calendar } from 'lucide-react';
import type { BatchResponse } from '@/client/types.gen';
import { siteConfig } from '@/config/site';

interface ProjectCardProps {
  project: BatchResponse;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const previewImages = project.image_associations.slice(0, 4);
  const totalImages = project.image_associations.length;

  return (
    <Link href={`/batches/${project.id}`}>
      <Card
        isPressable
        isHoverable
        className="bg-neutral-900 border border-neutral-800 hover:border-blue-500"
        radius="none"
      >
        <CardHeader className="aspect-video bg-neutral-800 flex items-center justify-center">
          <div className="relative w-44 h-44 flex-shrink-0 group flex items-center justify-center">
            {/* Image previews */}
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
                    src={siteConfig.urls.imageThumbnail(assoc.image.id)}
                    alt="Project image preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              );
            })}

            {/* Placeholder slots if fewer than 4 images */}
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

            {/* Placeholder if no images */}
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
                <p className="text-sm text-neutral-500">Contains {totalImages} images</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
};