/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Schema for returning full batch details.
 */
export type BatchResponse = {
    id: number;
    batch_name: string;
    status: string;
    image_ids: Array<number>;
    parameters: (Record<string, any> | null);
    cluster_summary: (Record<string, any> | null);
};

