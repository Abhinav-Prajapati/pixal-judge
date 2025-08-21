/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ImageResponse } from './ImageResponse';
/**
 * Schema for returning full batch details.
 */
export type BatchResponse = {
    id: number;
    batch_name: string;
    status: string;
    images: Array<ImageResponse>;
    parameters: (Record<string, any> | null);
    cluster_summary: (Record<string, any> | null);
};

