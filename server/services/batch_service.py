import numpy as np
from sqlalchemy.orm import Session
from fastapi import UploadFile
from typing import List, Dict, Tuple

from crud import crud_batch, crud_image
from database.models import ImageBatch, Image
from processing.grouping import ImageGrouper
from api.schemas import BatchAnalyze, ImageResponse
from services import image_service
from utils.exceptions import ServiceError
from utils.helpers import get_batch_or_404

def create_new_batch(db: Session, name: str, image_ids: List[int]) -> ImageBatch:
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise ServiceError("One or more image IDs not found.", 404)
    return crud_batch.create(db, name=name, images=images_to_add)

def rename_batch(db: Session, batch_id: int, new_name: str) -> ImageBatch:
    batch = get_batch_or_404(db, batch_id)
    batch.batch_name = new_name
    return crud_batch.update(db, db_obj=batch)

def add_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_404(db, batch_id)
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise ServiceError("One or more image IDs not found.", 404)
    
    for img in images_to_add:
        if img not in batch.images:
            batch.images.append(img)
    
    return crud_batch.update(db, db_obj=batch)

def remove_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_404(db, batch_id)
    ids_to_remove = set(image_ids)
    batch.images = [img for img in batch.images if img.id not in ids_to_remove]
    return crud_batch.update(db, db_obj=batch)

def upload_and_add(db: Session, batch_id: int, files: List[UploadFile]) -> Tuple[ImageBatch, List[Image | ImageResponse]]:
    batch = get_batch_or_404(db, batch_id)
    upload_results = image_service.process_new_uploads(db, files)
    
    newly_added_images = [res for res in upload_results if isinstance(res, Image)]
    for img in newly_added_images:
        if img not in batch.images:
            batch.images.append(img)
            
    updated_batch = crud_batch.update(db, db_obj=batch)
    return updated_batch, upload_results

def update_manual_groups(db: Session, batch_id: int, group_map: Dict[str, List[int]]) -> ImageBatch:
    batch = get_batch_or_404(db, batch_id)
    batch_image_ids = {img.id for img in batch.images}
    incoming_image_ids = {img_id for id_list in group_map.values() for img_id in id_list}
    if batch_image_ids != incoming_image_ids:
        raise ServiceError("The provided group map must contain the exact same set of images as the batch.")

    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for group_label, image_ids in group_map.items():
        for image_id in image_ids:
            if image_id in association_map:
                association_map[image_id].group_label = group_label
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)

def analyze_batch(db: Session, batch_id: int, params: BatchAnalyze) -> ImageBatch:
    batch = get_batch_or_404(db, batch_id)
    if not batch.images:
        raise ServiceError("Cannot analyze an empty batch.")
    if any(img.features is None for img in batch.images):
        raise ServiceError("One or more images are missing feature embeddings.")

    batch.status = 'processing'
    batch.parameters = params.dict()
    crud_batch.update(db, db_obj=batch)
    
    features_matrix = np.array([img.features for img in batch.images])
    
    grouper = ImageGrouper(
        min_cluster_size=params.min_cluster_size,
        min_samples=params.min_samples,
        metric=params.metric
    )
    labels = grouper.fit_predict(features_matrix)
    
    unique_cluster_labels = sorted([label for label in np.unique(labels) if label != -1])
    label_map = {label: f"Group {i+1}" for i, label in enumerate(unique_cluster_labels)}
    label_map[-1] = "Ungrouped"

    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for image, label in zip(batch.images, labels):
        if image.id in association_map:
            association_map[image.id].group_label = label_map.get(label, "Ungrouped")
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)