// File: services/batchService.ts
import { OpenAPI, ClusteringBatchesService, ImagesService, BatchResponse, ImageResponse } from '../api';

// Configure this once
OpenAPI.BASE = "http://127.0.0.1:8000";

export const batchService = {
  getBatch: (batchId: number): Promise<BatchResponse> => {
    return ClusteringBatchesService.getBatchDetailsBatchesBatchIdGet(batchId);
  },
  
  analyzeBatch: (batchId: number, params: { eps: number, min_samples: number, metric: string }): Promise<BatchResponse> => {
    return ClusteringBatchesService.analyzeBatchBatchesBatchIdAnalyzePut(batchId, params);
  },

  removeImages: (batchId: number, image_ids: number[]): Promise<any> => {
    return ClusteringBatchesService.removeImagesFromBatchBatchesBatchIdImagesDelete(batchId, { image_ids });
  },

  addImages: (batchId: number, image_ids: number[]): Promise<BatchResponse> => {
    return ClusteringBatchesService.addImagesToBatchBatchesBatchIdImagesPost(batchId, { image_ids });
  },
  
  getAllImages: (): Promise<ImageResponse[]> => {
    return ImagesService.getAllImagesImagesGet();
  },
};