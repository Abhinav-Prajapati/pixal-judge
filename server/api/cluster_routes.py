from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from services import batch_service
from crud import crud_batch
from .schemas import (
    BatchCreate, BatchResponse, BatchRename, BatchAnalyze,
    BatchUpdateImages, BatchGroupUpdate
)
from utils.exceptions import ServiceError
from utils.helpers import get_batch_or_404, queue_multiple_image_processing
from .tasks import generate_thumbnail_task, generate_embedding_task
from database.models import Image as ImageModel

router = APIRouter(prefix="/batches", tags=["Grouping Batches"])

@router.post("/", response_model=BatchResponse, operation_id="createBatch")
def create_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new batch with the specified images."""
    try:
        return batch_service.create_new_batch(db, name=batch_data.name, image_ids=batch_data.image_ids)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.get("/", response_model=List[BatchResponse], operation_id="getAllBatches")
def get_all_batches(db: Session = Depends(get_db)):
    """Returns all batches."""
    return crud_batch.get_multi(db)

@router.get("/{batch_id}", response_model=BatchResponse, operation_id="getBatch")
def get_batch_details(batch_id: int, db: Session = Depends(get_db)):
    """Returns details for a specific batch with images sorted by quality_rank within groups."""
    batch = get_batch_or_404(db, batch_id)
    
    # Sort associations by group_label, then by quality_rank (nulls last)
    batch.image_associations = sorted(
        batch.image_associations,
        key=lambda a: (
            a.group_label or "",
            a.quality_rank if a.quality_rank is not None else float('inf')
        )
    )
    
    return batch

@router.put("/{batch_id}", response_model=BatchResponse, operation_id="renameBatch")
def rename_batch(batch_id: int, batch_data: BatchRename, db: Session = Depends(get_db)):
    """Renames an existing batch."""
    try:
        return batch_service.rename_batch(db, batch_id=batch_id, new_name=batch_data.name)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.delete("/{batch_id}", operation_id="deleteBatch")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Deletes a batch."""
    batch = get_batch_or_404(db, batch_id)
    crud_batch.remove(db, batch=batch)
    return {"message": f"Batch ID {batch_id} deleted successfully."}

@router.post("/{batch_id}/images", response_model=BatchResponse, operation_id="addImagesToBatch")
def add_images_to_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Adds existing images to a batch."""
    try:
        return batch_service.add_images(db, batch_id=batch_id, image_ids=image_data.image_ids)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/{batch_id}/upload-and-add", response_model=BatchResponse, operation_id="uploadAndAddImagesToBatch")
def upload_and_add_to_batch(
    batch_id: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    files: List[UploadFile] = File(...)
):
    """Uploads new images and adds them to the batch."""
    try:
        updated_batch, upload_results = batch_service.upload_and_add(db, batch_id=batch_id, files=files)
        new_images = [res for res in upload_results if isinstance(res, ImageModel)]
        queue_multiple_image_processing(background_tasks, new_images, generate_thumbnail_task, generate_embedding_task)
        return updated_batch
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.delete("/{batch_id}/images", response_model=BatchResponse, operation_id="removeImagesFromBatch")
def remove_images_from_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Removes images from a batch."""
    try:
        return batch_service.remove_images(db, batch_id=batch_id, image_ids=image_data.image_ids)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.put("/{batch_id}/analyze", response_model=BatchResponse, operation_id="analyzeBatch")
def analyze_batch(batch_id: int, analysis_params: BatchAnalyze, db: Session = Depends(get_db)):
    """Analyzes a batch using clustering to group similar images."""
    try:
        return batch_service.analyze_batch(db, batch_id=batch_id, params=analysis_params)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.put("/{batch_id}/groups", response_model=BatchResponse, operation_id="updateGroupsInBatch")
def update_groups(batch_id: int, group_data: BatchGroupUpdate, db: Session = Depends(get_db)):
    """Manually updates the group assignments for images in a batch."""
    try:
        return batch_service.update_manual_groups(db, batch_id=batch_id, group_map=group_data.group_map)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

@router.post("/{batch_id}/groups/{group_label}/rank", response_model=BatchResponse, operation_id="rankGroupImages")
def rank_group_images(
    batch_id: int, 
    group_label: str, 
    metric: str = "liqe",
    db: Session = Depends(get_db)
):
    """Ranks images within a specific group by quality score."""
    try:
        return batch_service.rank_group_images(db, batch_id=batch_id, group_label=group_label, metric=metric)
    except ServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

