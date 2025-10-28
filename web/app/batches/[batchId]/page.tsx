"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type {
	GetImageMetadataError,
	ImageResponse,
	Metadata,
} from "@/client/types.gen";
import { getBatchOptions } from "@/client/@tanstack/react-query.gen";
import { client } from "@/client/client.gen";
import { ImageCard } from "@/components/ui/ImageCard";
import { ClusteringToolbox } from "@/components/ui/ClusteringToolbox";
import { Card } from "@heroui/card";
import { Button, ButtonGroup } from "@heroui/react";
import {
	Grid,
	LayoutGrid,
	X,
	Image as ImageIcon,
	Calendar,
	MapPin,
	Camera,
	Focus,
	Aperture,
	Timer,
	Sun,
	Text,
	Tags,
	Star,
	Hash,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { getImageMetadata } from "@/client";
import { useViewStore } from "./components/viewStore";
import { useSelectionStore } from "./components/selectionStore";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

/**
 * Accepts an onImageClick prop to make images selectable.
 */
function ImageGrid({
	images,
	onImageClick,
	onImageSelect,
	selectedImageIds,
}: {
	images: ImageResponse[];
	onImageClick: (image: ImageResponse) => void;
	onImageSelect: (image: ImageResponse) => void; // New prop for selection
	selectedImageIds: Set<number>; // New prop to know what's selected
}) {
	if (!images || images.length === 0) {
		return <p className="text-base-content/60">No images to display.</p>;
	}
	return (
		<div className="flex flex-wrap gap-2 ">
			{images.map((image) => {
				const isSelected = selectedImageIds.has(image.id);
				return (
					// Wrap ImageCard in a clickable div
					<div
						key={image.id}
						onClick={(e) => {
							// On Ctrl (Windows/Linux) or Meta (Mac) click, toggle selection
							if (e.ctrlKey || e.metaKey) {
								e.preventDefault();
								onImageSelect(image);
							} else {
								// On a normal click, open the detail panel
								onImageClick(image);
							}
						}}
						className={`cursor-pointer transition-all duration-150 ease-in-out
              ${isSelected
								? "ring-2 ring-primary ring-offset-2 ring-offset-base-100 rounded-md"
								: ""
							}
            `}
					>
						<ImageCard image={image} />
					</div>
				);
			})}
		</div>
	);
}

function MetadataRow({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ElementType;
	label: string;
	value: string | number | null | undefined;
}) {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	return (
		<div className="flex items-start gap-3">
			<Icon size={14} className="text-default-500 flex-shrink-0 mt-0.5" />
			<div className="flex flex-col">
				<span className="text-xs text-default-600">{label}</span>
				<span className="text-sm text-default-900 break-all">
					{String(value)}
				</span>
			</div>
		</div>
	);
}

function MetadataDisplay({ metadata }: { metadata: Metadata }) {
	// Format 'shot_at' to be more readable
	const shotAtFormatted = metadata.shot_at
		? new Date(metadata.shot_at).toLocaleString(undefined, {
			dateStyle: "medium",
			timeStyle: "short",
		})
		: null;

	// Format 'tags' nicely
	const tagsFormatted = Array.isArray(metadata.tags)
		? metadata.tags.join(", ")
		: metadata.tags;

	// Create a star rating string
	const ratingFormatted = metadata.rating
		? "★".repeat(metadata.rating) + "☆".repeat(5 - metadata.rating)
		: null;

	// Combine dimensions
	const dimensions =
		metadata.width && metadata.height
			? `${metadata.width} x ${metadata.height}`
			: null;

	// Combine location
	const location =
		metadata.latitude && metadata.longitude
			? `${metadata.latitude.toFixed(4)}, ${metadata.longitude.toFixed(4)}`
			: null;

	// Combine camera make and model
	const camera = [metadata.camera_make, metadata.camera_model]
		.filter(Boolean)
		.join(" ");

	return (
		<div className="flex flex-col gap-4">
			<MetadataRow icon={ImageIcon} label="Dimensions" value={dimensions} />
			<MetadataRow icon={Calendar} label="Shot At" value={shotAtFormatted} />
			<MetadataRow icon={Camera} label="Camera" value={camera} />
			<MetadataRow icon={MapPin} label="Location" value={location} />
			<MetadataRow
				icon={Aperture}
				label="Aperture"
				value={metadata.f_number ? `f/${metadata.f_number}` : null}
			/>
			<MetadataRow
				icon={Focus}
				label="Focal Length"
				value={metadata.focal_length}
			/>
			<MetadataRow
				icon={Timer}
				label="Exposure Time"
				value={metadata.exposure_time}
			/>
			<MetadataRow icon={Sun} label="ISO" value={metadata.iso} />
			<MetadataRow icon={Star} label="Rating" value={ratingFormatted} />
			{/* <MetadataRow icon={Tags} label="Tags" value={tagsFormatted} /> */}

			{/* Special handling for caption as it can be long */}
			{metadata.caption && (
				<div className="flex items-start gap-3">
					<Text size={14} className="text-default-500 flex-shrink-0 mt-0.5" />
					<div className="flex flex-col">
						<span className="text-xs text-default-600">Caption</span>
						<p className="text-sm text-default-900 break-words whitespace-pre-wrap">
							{metadata.caption}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

function ImageDetailPanel({
	image,
	onClose,
}: {
	image: ImageResponse;
	onClose: () => void;
}) {
	const imageUrl = siteConfig.urls.image(image.id);

	const {
		data: metadata,
		isLoading,
		isError,
	} = useQuery<Metadata, GetImageMetadataError>({
		queryKey: ["imageMetadata", image.id],
		queryFn: async () => {
			const response = await getImageMetadata({
				path: { image_id: image.id },
				throwOnError: true,
			});
			return response.data;
		},
		enabled: !!image.id,
	});

	return (
		<div className="flex flex-col w-98 flex-shrink-0 h-screen sticky top-0 border-l border-default-200 bg-content1">
			{/* Panel Header */}
			<div className="flex flex-shrink-0 items-center justify-between p-2 border-b border-default-200">
				<h2
					className="text-lg font-semibold truncate"
					title={image.original_filename}
				>
					{image.original_filename}
				</h2>
				<Button
					variant="light"
					color="default"
					onPress={onClose}
					isIconOnly
					aria-label="Close panel"
				>
					<X size={20} />
				</Button>
			</div>

			{/* Panel Content (Scrollable) */}
			<div className="flex-grow overflow-y-auto">
				{/* Image on top */}
				<div className="bg-black p-1">
					<img
						src={imageUrl}
						alt={image.filename}
						className="w-full h-auto object-contain max-h-96"
					/>
				</div>

				<div className="p-4">
					<h3 className="font-semibold mb-3 text-default-800">Metadata</h3>
					<div className="text-sm">
						{isLoading && (
							<p className="text-default-500">Loading metadata...</p>
						)}
						{isError && <p className="text-danger">Failed to load metadata.</p>}
						{metadata && <MetadataDisplay metadata={metadata} />}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function BatchImagesPage() {
	const params = useParams();
	const batchId = Number(params.batchId);

	// State from your stores
	const { view, setView } = useViewStore();
	const { selectedImageIds, toggleSelection } = useSelectionStore();

	// Local state for the detail panel
	const [selectedImage, setSelectedImage] = useState<ImageResponse | null>(
		null,
	);

	// Callback for opening the detail panel (normal click)
	const handleImageClick = useCallback((image: ImageResponse) => {
		setSelectedImage(image);
	}, []);

	// Callback for closing the detail panel
	const handleClosePanel = useCallback(() => {
		setSelectedImage(null);
	}, []);

	// Callback for toggling selection (Ctrl/Cmd + Click)
	const handleImageSelect = useCallback(
		(image: ImageResponse) => {
			toggleSelection(image.id);
		},
		[toggleSelection],
	);

	const {
		data: batch,
		isLoading,
		isError,
		error,
	} = useQuery({
		...getBatchOptions({ path: { batch_id: batchId } }),
		enabled: !isNaN(batchId),
	});

	const allImages = useMemo(() => {
		if (!batch?.image_associations) return [];
		return batch.image_associations.map((assoc) => assoc.image);
	}, [batch]);

	const clusterEntries = useMemo(() => {
		if (!batch?.image_associations) return [];
		const clusters = batch.image_associations.reduce(
			(acc, assoc) => {
				const { image, group_label } = assoc;
				const key = group_label ?? "Ungrouped";
				if (!acc[key]) acc[key] = [];
				acc[key].push(image);
				return acc;
			},
			{} as Record<string, ImageResponse[]>,
		);
		const unsortedEntries = Object.entries(clusters);
		unsortedEntries.sort(
			([, imagesA], [, imagesB]) => imagesB.length - imagesA.length,
		);
		return unsortedEntries;
	}, [batch]);

	if (isNaN(batchId)) {
		return (
			<div className="flex items-center justify-center h-full text-error">
				<p>Invalid Batch ID provided in the URL.</p>
			</div>
		);
	}
	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-full">
				<p>Loading images for Batch {batchId}...</p>
			</div>
		);
	}
	if (isError) {
		return (
			<div className="flex items-center justify-center h-full text-error">
				<p>Could not fetch batch data: {error.message}</p>
			</div>
		);
	}
	if (!batch) {
		return (
			<div className="p-4">
				<h1 className="text-2xl font-bold mb-4">Batch {batchId}</h1>
				<div className="flex items-center justify-center h-48 rounded-md bg-base-200">
					<p className="text-base-content/60">This batch contains no images.</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="flex flex-row w-full">
				{/* Sidebar */}
				<div className="flex flex-col w-64 h-screen sticky top-0 flex-shrink-0">
					<ClusteringToolbox batchId={batchId} />
				</div>

				{/* Image Grid Area (takes up remaining space) */}
				<div className="flex flex-col flex-grow min-w-0">
					{" "}
					{/* min-w-0 is important for flex-grow */}
					{/* View Switcher Nav */}
					<nav className="flex flex-shrink-0 items-center gap-2 p-2 bg-content1 border-b border-default-200 sticky top-0 z-10 justify-end">
						<ButtonGroup>
							<Button
								variant={view === "all" ? "solid" : "bordered"}
								color="primary"
								onPress={() => setView("all")}
								startContent={<Grid size={18} />}
								radius="none"
							>
								All Images ({allImages.length})
							</Button>
							<Button
								variant={view === "grouped" ? "solid" : "bordered"}
								color="primary"
								onPress={() => setView("grouped")}
								startContent={<LayoutGrid size={18} />}
								radius="none"
							>
								Grouped View
							</Button>
						</ButtonGroup>
					</nav>
					{/* Page Content Area */}
					<div className="flex-grow p-4">
						{view === "all" && (
							<ImageGrid
								images={allImages}
								onImageClick={handleImageClick}
								onImageSelect={handleImageSelect}
								selectedImageIds={selectedImageIds}
							/>
						)}
						{view === "grouped" && (
							<div className="flex flex-col gap-6">
								{clusterEntries.map(([clusterId, images]) => (
									<section key={clusterId}>
										<h2 className="mb-3 text-lg font-bold">
											{clusterId}
											<span className="ml-2 text-sm font-normal text-default-500">
												({images.length})
											</span>
										</h2>
										<ImageGrid
											images={images}
											onImageClick={handleImageClick}
											onImageSelect={handleImageSelect}
											selectedImageIds={selectedImageIds}
										/>
									</section>
								))}
							</div>
						)}
					</div>
				</div>

				{selectedImage && (
					<ImageDetailPanel image={selectedImage} onClose={handleClosePanel} />
				)}
			</div>
		</>
	);
}