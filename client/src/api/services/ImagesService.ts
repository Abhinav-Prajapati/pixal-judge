/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Body_upload_images_images_upload_post } from '../models/Body_upload_images_images_upload_post';
import type { ImageResponse } from '../models/ImageResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ImagesService {
    /**
     * Upload Images
     * Uploads one or more image files and triggers background processing for each.
     * @param formData
     * @returns ImageResponse Successful Response
     * @throws ApiError
     */
    public static uploadImagesImagesUploadPost(
        formData: Body_upload_images_images_upload_post,
    ): CancelablePromise<Array<ImageResponse>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/images/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Images
     * Retrieves a list of all images in the database.
     * @returns ImageResponse Successful Response
     * @throws ApiError
     */
    public static getAllImagesImagesGet(): CancelablePromise<Array<ImageResponse>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/images/',
        });
    }
    /**
     * Get Image File
     * Returns the original image file.
     * @param imageId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getImageFileImagesImageIdGet(
        imageId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/images/{image_id}',
            path: {
                'image_id': imageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Image
     * Deletes an image's database record and its physical files.
     * @param imageId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteImageImagesImageIdDelete(
        imageId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/images/{image_id}',
            path: {
                'image_id': imageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Thumbnail File
     * Returns the thumbnail file for an image.
     * @param imageId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getThumbnailFileImagesThumbnailImageIdGet(
        imageId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/images/thumbnail/{image_id}',
            path: {
                'image_id': imageId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
