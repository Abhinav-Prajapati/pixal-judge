/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BatchAnalyze } from '../models/BatchAnalyze';
import type { BatchCreate } from '../models/BatchCreate';
import type { BatchResponse } from '../models/BatchResponse';
import type { BatchUpdateImages } from '../models/BatchUpdateImages';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ClusteringBatchesService {
    /**
     * Get All Batches
     * Retrieves a list of all clustering batches.
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
}
