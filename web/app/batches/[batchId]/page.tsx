"use client";

import React, { useEffect } from "react";

import { useBatchViewStore } from "./components/useBatchViewStore";
import { BatchToolBox } from "./components/BatchToolBox";
import { ImageDisplayArea } from "./components/ImageDisplayArea";
import { ImageDetailPanel } from "./components/ImageDetailPanel";

import { useBatchData } from "@/hooks/useBatchData";
import { useImageInteractions } from "@/hooks/useImageInteractions";
import { client } from "@/client/client.gen";

export default function BatchImagesPage() {
	// Configure API client on mount (client-side only)
	useEffect(() => {
		const API_BASE_URL =
			process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
		client.setConfig({ baseUrl: API_BASE_URL });
	}, []);

	const {
		batchId,
		batch,
		allImages,
		clusterEntries,
		isLoading,
		isError,
		error,
		refetch,
	} = useBatchData();

	const { selectedImageIds, handleImageSelect } = useImageInteractions();

	const { detailImage, showImageDetails, closeImageDetails } =
		useBatchViewStore();

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
			<div className="flex flex-col h-full p-8">
				<h1 className="text-2xl font-bold mb-6">Batch {batchId}</h1>
				<div className="flex-grow flex items-center justify-center">
					<div className="max-w-md w-full p-8 rounded-lg border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
						<div className="flex flex-col items-center space-y-4 text-neutral-500 dark:text-neutral-400">
							<div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-700/50">
								<svg
									className="w-16 h-16"
									fill="none"
									stroke="currentColor"
									strokeWidth={1.5}
									viewBox="0 0 24 24"
								>
									<path
										d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<h2 className="text-xl font-semibold">Empty Batch</h2>
							<p className="text-center text-sm">
								This batch doesn't contain any images yet. You can add images to
								this batch by uploading them or importing from other batches.
							</p>
						</div>
					</div>
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
					batchId={batchId}
					clusterEntries={clusterEntries}
					selectedImageIds={selectedImageIds}
					onImageClick={showImageDetails}
					onImageSelect={handleImageSelect}
					onRankComplete={() => refetch()}
				/>

				{/* Use state from the store */}
				{detailImage && (
					<ImageDetailPanel image={detailImage} onClose={closeImageDetails} />
				)}
			</div>
		</>
	);
}
