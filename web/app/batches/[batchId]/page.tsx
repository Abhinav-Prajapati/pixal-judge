"use client";

import React from "react";
import { client } from "@/client/client.gen";

import { useBatchData } from "@/hooks/useBatchData";
import { useImageInteractions } from "@/hooks/useImageInteractions";

import { BatchToolBox } from "./components/BatchToolBox";
import { ImageDisplayArea } from "./components/ImageDisplayArea";
import { ImageDetailPanel } from "./components/ImageDetailPanel";

const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
client.setConfig({ baseUrl: API_BASE_URL });

export default function BatchImagesPage() {
	const {
		batchId,
		batch,
		allImages,
		clusterEntries,
		isLoading,
		isError,
		error,
	} = useBatchData();

	const {
		selectedImage,
		handleImageClick,
		handleClosePanel,
		selectedImageIds,
		handleImageSelect,
	} = useImageInteractions();

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
				<p>Could not fetch batch data.</p>
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
				<BatchToolBox batchId={batchId} />

				<ImageDisplayArea
					allImages={allImages}
					clusterEntries={clusterEntries}
					onImageClick={handleImageClick}
					onImageSelect={handleImageSelect}
					selectedImageIds={selectedImageIds}
				/>

				{selectedImage && (
					<ImageDetailPanel image={selectedImage} onClose={handleClosePanel} />
				)}
			</div>
		</>
	);
}