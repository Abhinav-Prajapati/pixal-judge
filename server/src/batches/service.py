"""Business logic for Batch domain."""
import numpy as np
from sqlalchemy.orm import Session
from fastapi import UploadFile
from typing import List, Dict, Tuple
from datetime import datetime, timezone

from src.batches import crud
from src.batches.models import ImageBatch
from src.batches.schemas import BatchAnalyze
from src.batches.exceptions import BatchNotFound, BatchValidationError
from src.images import crud as image_crud
from src.images.models import Image
from src.images import service as image_service
from src.images.schemas import ImageResponse
from processing.grouping import ImageGrouper


def create_new_batch(db: Session, name: str, image_ids: List[int]) -> ImageBatch:
    """Create a new batch with specified images."""
    images_to_add = image_crud.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchValidationError("One or more image IDs not found.")
    return crud.create(db, name=name, images=images_to_add)


def rename_batch(db: Session, batch_id: int, new_name: str) -> ImageBatch:
    """Rename an existing batch."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
    batch.batch_name = new_name
    return crud.update(db, db_obj=batch)


def add_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    """Add images to a batch."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
        
    images_to_add = image_crud.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchValidationError("One or more image IDs not found.")
    
    for img in images_to_add:
        if img not in batch.images:
            batch.images.append(img)
    
    return crud.update(db, db_obj=batch)


def remove_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    """Remove images from a batch."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
        
    ids_to_remove = set(image_ids)
    batch.images = [img for img in batch.images if img.id not in ids_to_remove]
    return crud.update(db, db_obj=batch)


def upload_and_add(db: Session, batch_id: int, files: List[UploadFile]) -> Tuple[ImageBatch, List[Image | ImageResponse]]:
    """Upload new images and add them to a batch."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
        
    upload_results = image_service.process_new_uploads(db, files)
    
    newly_added_images = [res for res in upload_results if isinstance(res, Image)]
    for img in newly_added_images:
        if img not in batch.images:
            batch.images.append(img)
            
    updated_batch = crud.update(db, db_obj=batch)
    return updated_batch, upload_results


def update_manual_groups(db: Session, batch_id: int, group_map: Dict[str, List[int]]) -> ImageBatch:
    """Manually update group assignments for batch images."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
        
    batch_image_ids = {img.id for img in batch.images}
    incoming_image_ids = {img_id for id_list in group_map.values() for img_id in id_list}
    
    if batch_image_ids != incoming_image_ids:
        raise BatchValidationError(
            "The provided group map must contain the exact same set of images as the batch."
        )

    association_map = crud.get_associations_map(db, batch_id=batch.id)
    for group_label, image_ids in group_map.items():
        for image_id in image_ids:
            if image_id in association_map:
                association_map[image_id].group_label = group_label
    
    batch.status = 'complete'
    return crud.update(db, db_obj=batch)


def analyze_batch(db: Session, batch_id: int, params: BatchAnalyze) -> ImageBatch:
    """Analyze batch using HDBSCAN clustering."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
        
    if not batch.images:
        raise BatchValidationError("Cannot analyze an empty batch.")
        
    if any(img.features is None for img in batch.images):
        raise BatchValidationError("One or more images are missing feature embeddings.")

    batch.status = 'processing'
    batch.parameters = params.model_dump()
    crud.update(db, db_obj=batch)
    
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

    association_map = crud.get_associations_map(db, batch_id=batch.id)
    for image, label in zip(batch.images, labels):
        if image.id in association_map:
            association_map[image.id].group_label = label_map.get(label, "Ungrouped")
    
    batch.status = 'complete'
    return crud.update(db, db_obj=batch)


def rank_group_images(db: Session, batch_id: int, group_label: str, metric: str = "liqe") -> ImageBatch:
    """Rank images within a group by quality score."""
    batch = crud.get(db, batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
    
    group_associations = [
        assoc for assoc in batch.image_associations 
        if assoc.group_label == group_label
    ]
    
    if not group_associations:
        raise BatchValidationError(f"No images found in group '{group_label}'")
    
    image_ids = [assoc.image_id for assoc in group_associations]
    
    quality_results = []
    for image_id in image_ids:
        score = image_service.analyze_image_quality(db, image_id, metric, force_reanalyze=False)
        quality_results.append((image_id, score))
    
    quality_results.sort(key=lambda x: x[1], reverse=True)
    
    association_map = {assoc.image_id: assoc for assoc in group_associations}
    now = datetime.now(timezone.utc)
    
    for rank, (image_id, score) in enumerate(quality_results, start=1):
        assoc = association_map[image_id]
        assoc.quality_rank = rank
        assoc.ranked_at = now
        assoc.ranking_metric = metric
    
    db.commit()
    db.refresh(batch)
    return batch
