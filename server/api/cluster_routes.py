from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
import numpy as np
from typing import List, Dict

from database.database import get_db
from database.models import Image, ImageBatch, ImageBatchAssociation
from processing.grouping import ImageGrouper
from .schemas import (BatchCreate, BatchAnalyze, BatchUpdateImages, 
                      BatchResponse, BatchGroupUpdate, BatchRename)
from utils.file_handling import handle_uploaded_image
from api.tasks import process_image_in_background

router = APIRouter(
    prefix="/batches",
    tags=["Grouping Batches"]
)

@router.post("/", response_model=BatchResponse, operation_id="createBatch")
def create_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new, unprocessed batch by associating it with existing images."""
    images_to_add = db.query(Image).filter(Image.id.in_(batch_data.image_ids)).all()
    
    if len(images_to_add) != len(set(batch_data.image_ids)):
        raise HTTPException(status_code=404, detail="One or more image IDs not found.")

    new_batch = ImageBatch(
        batch_name=batch_data.name,
        images=images_to_add,
        status='pending'
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.get("/", response_model=List[BatchResponse], operation_id="getAllBatches")
def get_all_batches(db: Session = Depends(get_db)):
    """Retrieves a list of all grouping batches with full image details."""
    return db.query(ImageBatch).all()

@router.get("/{batch_id}", response_model=BatchResponse, operation_id="getBatch")
def get_batch_details(batch_id: int, db: Session = Depends(get_db)):
    """Gets all information about a specific batch by its ID."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return batch

@router.put("/{batch_id}", response_model=BatchResponse, operation_id="renameBatch")
def rename_batch(batch_id: int, batch_data: BatchRename, db: Session = Depends(get_db)):
    """Renames an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    batch.batch_name = batch_data.name
    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/{batch_id}", operation_id="deleteBatch")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Deletes an existing batch and its associations."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
        
    db.delete(batch)
    db.commit()
    return {"message": f"Batch ID {batch_id} deleted successfully."}

@router.post("/{batch_id}/images", response_model=BatchResponse, operation_id="addImagesToBatch")
def add_images_to_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Adds one or more images to an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    images_to_add = db.query(Image).filter(Image.id.in_(image_data.image_ids)).all()
    if len(images_to_add) != len(set(image_data.image_ids)):
        raise HTTPException(status_code=404, detail="One or more image IDs were not found.")

    for img in images_to_add:
        if img not in batch.images:
            batch.images.append(img)
            
    db.commit()
    db.refresh(batch)
    return batch

@router.post("/{batch_id}/upload-and-add", response_model=BatchResponse, operation_id="uploadAndAddImagesToBatch")
def upload_and_add_to_batch(
    batch_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), 
    files: List[UploadFile] = File(...)
):
    """Uploads one or more images and adds them to a specific batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    for file in files:
        try:
            image_model = handle_uploaded_image(file, db)
            if image_model not in batch.images:
                batch.images.append(image_model)
            background_tasks.add_task(process_image_in_background, image_model.id)
        except Exception:
            continue
            
    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/{batch_id}/images", response_model=BatchResponse, operation_id="removeImagesFromBatch")
def remove_images_from_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Removes one or more images from an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    ids_to_remove = set(image_data.image_ids)
    batch.images = [img for img in batch.images if img.id not in ids_to_remove]
    
    db.commit()
    db.refresh(batch)
    return batch

@router.put("/{batch_id}/analyze", response_model=BatchResponse, operation_id="analyzeBatch")
def analyze_batch(batch_id: int, analysis_params: BatchAnalyze, db: Session = Depends(get_db)):
    """Runs the grouping analysis on a batch and stores the results."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    if not batch.images:
        raise HTTPException(status_code=400, detail="Cannot analyze an empty batch.")
        
    images_to_group = batch.images
    if any(img.features is None for img in images_to_group):
        raise HTTPException(status_code=400, detail="One or more images are missing feature embeddings.")
    
    batch.status = 'processing'
    batch.parameters = analysis_params.dict()
    db.commit()

    features_matrix = np.array([img.features for img in images_to_group])
    grouper = ImageGrouper(eps=analysis_params.eps, min_samples=analysis_params.min_samples, metric=analysis_params.metric)
    labels = grouper.fit_predict(features_matrix)

    association_map = {assoc.image_id: assoc for assoc in batch.image_associations}
    for image, label in zip(images_to_group, labels):
        if image.id in association_map:
            association_map[image.id].group_label = str(label)

    batch.status = 'complete'
    db.commit()
    db.refresh(batch)
    return batch

@router.put("/{batch_id}/groups", response_model=BatchResponse, operation_id="updateGroupsInBatch")
def update_groups(batch_id: int, group_data: BatchGroupUpdate, db: Session = Depends(get_db)):
    """Manually updates the group assignments for images in a batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    batch_image_ids = {img.id for img in batch.images}
    incoming_image_ids = {img_id for id_list in group_data.group_map.values() for img_id in id_list}
    if batch_image_ids != incoming_image_ids:
        raise HTTPException(status_code=400, detail="The provided group map must contain the exact same set of images as the batch.")

    association_map = {assoc.image_id: assoc for assoc in batch.image_associations}
    for group_label, image_ids in group_data.group_map.items():
        for image_id in image_ids:
            if image_id in association_map:
                association_map[image_id].group_label = group_label

    batch.status = 'complete'
    db.commit()
    db.refresh(batch)
    return batch