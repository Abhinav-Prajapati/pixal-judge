/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchAnalyze } from '../models/BatchAnalyze';
import type { BatchClusterUpdate } from '../models/BatchClusterUpdate';
import type { BatchCreate } from '../models/BatchCreate';
import type { BatchResponse } from '../models/BatchResponse';
import type { BatchUpdateImages } from '../models/BatchUpdateImages';
import type { Body_upload_and_add_to_batch_batches__batch_id__upload_and_add_post } from '../models/Body_upload_and_add_to_batch_batches__batch_id__upload_and_add_post';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClusteringBatchesService {
    /**
     * Get All Batches
     * Retrieves a list of all clustering batches with full image details.
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static getAllBatchesBatchesGet(): CancelablePromise<Array<BatchResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/batches/',
        });
    }
    /**
     * Create Batch
     * Creates a new, unprocessed batch record with a list of image IDs.
     * @param requestBody
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static createBatchBatchesPost(
        requestBody: BatchCreate,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/batches/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Batch Details
     * Gets all information about a specific batch by its ID.
     * @param batchId
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static getBatchDetailsBatchesBatchIdGet(
        batchId: number,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/batches/{batch_id}',
            path: {
                'batch_id': batchId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Add Images To Batch
     * Adds one or more images to an existing batch.
     * @param batchId
     * @param requestBody
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static addImagesToBatchBatchesBatchIdImagesPost(
        batchId: number,
        requestBody: BatchUpdateImages,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/batches/{batch_id}/images',
            path: {
                'batch_id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove Images From Batch
     * Removes one or more images from an existing batch.
     * @param batchId
     * @param requestBody
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static removeImagesFromBatchBatchesBatchIdImagesDelete(
        batchId: number,
        requestBody: BatchUpdateImages,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/batches/{batch_id}/images',
            path: {
                'batch_id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload And Add To Batch
     * Uploads one or more images and adds them to a specific batch.
     * - Utilizes the existing image upload logic, including duplicate detection.
     * - New images trigger background processing for feature extraction.
     * - Adds the processed image IDs (both new and duplicates) to the specified batch.
     * @param batchId
     * @param formData
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static uploadAndAddToBatchBatchesBatchIdUploadAndAddPost(
        batchId: number,
        formData: Body_upload_and_add_to_batch_batches__batch_id__upload_and_add_post,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/batches/{batch_id}/upload-and-add',
            path: {
                'batch_id': batchId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Analyze Batch
     * Runs (or re-runs) the clustering analysis on a batch.
     * @param batchId
     * @param requestBody
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static analyzeBatchBatchesBatchIdAnalyzePut(
        batchId: number,
        requestBody: BatchAnalyze,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/batches/{batch_id}/analyze',
            path: {
                'batch_id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Clusters
     * Manually updates the cluster assignments for a batch.
     * Validates that the new cluster map contains the exact same set of images
     * as the batch itself.
     * @param batchId
     * @param requestBody
     * @returns BatchResponse Successful Response
     * @throws ApiError
     */
    public static updateClustersBatchesBatchIdClustersPut(
        batchId: number,
        requestBody: BatchClusterUpdate,
    ): CancelablePromise<BatchResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/batches/{batch_id}/clusters',
            path: {
                'batch_id': batchId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
