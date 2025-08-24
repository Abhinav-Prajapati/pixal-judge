import numpy as np
from sqlalchemy.orm import Session
from fastapi import UploadFile
from typing import List, Dict, Union

from crud import crud_batch, crud_image
from database.models import ImageBatch, Image
from processing.grouping import ImageGrouper
from api.schemas import BatchAnalyze, ImageResponse
from services import image_service

class BatchServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def get_batch_or_fail(db: Session, batch_id: int) -> ImageBatch:
    batch = crud_batch.get(db, batch_id=batch_id)
    if not batch:
        raise BatchServiceError("Batch not found.", 404)
    return batch

def create_new_batch(db: Session, name: str, image_ids: list[int]) -> ImageBatch:
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchServiceError("One or more image IDs not found.", 404)
    return crud_batch.create(db, name=name, images=images_to_add)

def rename_batch(db: Session, batch_id: int, new_name: str) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    batch.batch_name = new_name
    return crud_batch.update(db, db_obj=batch)

def add_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchServiceError("One or more image IDs not found.", 404)
    
    for img in images_to_add:
        if img not in batch.images:
            batch.images.append(img)
    
    return crud_batch.update(db, db_obj=batch)

def remove_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    ids_to_remove = set(image_ids)
    batch.images = [img for img in batch.images if img.id not in ids_to_remove]
    return crud_batch.update(db, db_obj=batch)

def upload_and_add(db: Session, batch_id: int, files: List[UploadFile]) -> (ImageBatch, List[Union[Image, ImageResponse]]):
    batch = get_batch_or_fail(db, batch_id)
    upload_results = image_service.process_new_uploads(db, files)
    
    newly_added_images = [res for res in upload_results if isinstance(res, Image)]
    for img in newly_added_images:
        if img not in batch.images:
            batch.images.append(img)
            
    updated_batch = crud_batch.update(db, db_obj=batch)
    return updated_batch, upload_results

def update_manual_groups(db: Session, batch_id: int, group_map: Dict[str, List[int]]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    batch_image_ids = {img.id for img in batch.images}
    incoming_image_ids = {img_id for id_list in group_map.values() for img_id in id_list}
    if batch_image_ids != incoming_image_ids:
        raise BatchServiceError("The provided group map must contain the exact same set of images as the batch.")

    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for group_label, image_ids in group_map.items():
        for image_id in image_ids:
            if image_id in association_map:
                association_map[image_id].group_label = group_label
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)

def analyze_batch(db: Session, batch_id: int, params: BatchAnalyze) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    if not batch.images:
        raise BatchServiceError("Cannot analyze an empty batch.")
    if any(img.features is None for img in batch.images):
        raise BatchServiceError("One or more images are missing feature embeddings.")

    batch.status = 'processing'
    batch.parameters = params.dict()
    crud_batch.update(db, db_obj=batch)
    
    features_matrix = np.array([img.features for img in batch.images])
    grouper = ImageGrouper(eps=params.eps, min_samples=params.min_samples, metric=params.metric)
    labels = grouper.fit_predict(features_matrix)
    
    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for image, label in zip(batch.images, labels):
        if image.id in association_map:
            association_map[image.id].group_label = str(label)
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)