"""API router for Batch domain."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from src.batches import service, crud
from src.batches.models import ImageBatch
from src.batches.schemas import BatchCreate, BatchResponse, BatchRename, BatchAnalyze, BatchUpdateImages, BatchGroupUpdate
from src.batches.exceptions import BatchNotFound, BatchValidationError
from src.batches.dependencies import get_batch_or_404
from src.images.models import Image as ImageModel
from src.images.utils import queue_image_tasks
from tasks import generate_thumbnail_task, generate_embedding_task


router = APIRouter(prefix="/batches", tags=["Grouping Batches"])


@router.post("/", response_model=BatchResponse, operation_id="createBatch")
def create_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new batch with the specified images."""
    try:
        return service.create_new_batch(db, name=batch_data.name, image_ids=batch_data.image_ids)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.get("/", response_model=List[BatchResponse], operation_id="getAllBatches")
def get_all_batches(db: Session = Depends(get_db)):
    """Returns all batches."""
    return crud.get_multi(db)


@router.get("/{batch_id}", response_model=BatchResponse, operation_id="getBatch")
def get_batch_details(batch: ImageBatch = Depends(get_batch_or_404)):
    """Returns details for a specific batch with images sorted by quality_rank within groups."""
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
        return service.rename_batch(db, batch_id=batch_id, new_name=batch_data.name)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.delete("/{batch_id}", operation_id="deleteBatch")
def delete_batch(batch: ImageBatch = Depends(get_batch_or_404), db: Session = Depends(get_db)):
    """Deletes a batch."""
    crud.remove(db, batch=batch)
    return {"message": f"Batch ID {batch.id} deleted successfully."}


@router.post("/{batch_id}/images", response_model=BatchResponse, operation_id="addImagesToBatch")
def add_images_to_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Adds existing images to a batch."""
    try:
        return service.add_images(db, batch_id=batch_id, image_ids=image_data.image_ids)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.post("/{batch_id}/upload-and-add", response_model=BatchResponse, operation_id="uploadAndAddImagesToBatch")
def upload_and_add_to_batch(
    batch_id: int, 
    db: Session = Depends(get_db), 
    files: List[UploadFile] = File(...)
):
    """Uploads new images and adds them to the batch."""
    try:
        updated_batch, upload_results = service.upload_and_add(db, batch_id=batch_id, files=files)
        new_images = [res for res in upload_results if isinstance(res, ImageModel)]
        queue_image_tasks(new_images, generate_thumbnail_task, generate_embedding_task)
        return updated_batch
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.delete("/{batch_id}/images", response_model=BatchResponse, operation_id="removeImagesFromBatch")
def remove_images_from_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Removes images from a batch."""
    try:
        return service.remove_images(db, batch_id=batch_id, image_ids=image_data.image_ids)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.put("/{batch_id}/analyze", response_model=BatchResponse, operation_id="analyzeBatch")
def analyze_batch(batch_id: int, analysis_params: BatchAnalyze, db: Session = Depends(get_db)):
    """Analyzes a batch using clustering to group similar images."""
    try:
        return service.analyze_batch(db, batch_id=batch_id, params=analysis_params)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.put("/{batch_id}/groups", response_model=BatchResponse, operation_id="updateGroupsInBatch")
def update_groups(batch_id: int, group_data: BatchGroupUpdate, db: Session = Depends(get_db)):
    """Manually updates the group assignments for images in a batch."""
    try:
        return service.update_manual_groups(db, batch_id=batch_id, group_map=group_data.group_map)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.post("/{batch_id}/groups/{group_label}/rank", response_model=BatchResponse, operation_id="rankGroupImages")
def rank_group_images(
    batch_id: int, 
    group_label: str, 
    metric: str = "liqe",
    db: Session = Depends(get_db)
):
    """Ranks images within a specific group by quality score."""
    try:
        return service.rank_group_images(db, batch_id=batch_id, group_label=group_label, metric=metric)
    except (BatchNotFound, BatchValidationError) as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
