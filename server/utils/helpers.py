from pathlib import Path
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from crud import crud_image, crud_batch
from database.models import Image, ImageBatch
from utils.exceptions import NotFoundError

def get_image_or_404(db: Session, image_id: int) -> Image:
    """Get an image by ID or raise 404 error."""
    image = crud_image.get(db, image_id=image_id)
    if not image:
        raise NotFoundError("Image")
    return image

def get_batch_or_404(db: Session, batch_id: int) -> ImageBatch:
    """Get a batch by ID or raise 404 error."""
    batch = crud_batch.get(db, batch_id=batch_id)
    if not batch:
        raise NotFoundError("Batch")
    return batch

def get_file_response(file_path: Path, resource_name: str = "File") -> FileResponse:
    """Return a file response or raise 404 if file doesn't exist."""
    if not file_path.is_file():
        raise NotFoundError(f"{resource_name} file on disk")
    return FileResponse(file_path)

def queue_image_processing(background_tasks, image_id: int, thumbnail_task, embedding_task):
    """Queue background tasks for image processing."""
    background_tasks.add_task(thumbnail_task, image_id)
    background_tasks.add_task(embedding_task, image_id)

def queue_multiple_image_processing(background_tasks, images: List[Image], thumbnail_task, embedding_task):
    """Queue background tasks for multiple images."""
    for image in images:
        queue_image_processing(background_tasks, image.id, thumbnail_task, embedding_task)
