from pathlib import Path
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from crud import crud_image, crud_batch
from src.images.models import Image
from database.models import ImageBatch
from src.images.exceptions import ImageNotFound
from utils.exceptions import NotFoundError

def get_image_or_404(db: Session, image_id: int) -> Image:
    """
    Get an image by ID or raise 404 error.
    Kept for backward compatibility - new code should use src.images.dependencies.get_image_or_404
    """
    image = crud_image.get(db, image_id=image_id)
    if not image:
        raise ImageNotFound(image_id)
    return image

def get_batch_or_404(db: Session, batch_id: int) -> ImageBatch:
    """Get a batch by ID or raise 404 error."""
    batch = crud_batch.get(db, batch_id=batch_id)
    if not batch:
        raise NotFoundError("Batch")
    return batch

def get_file_response(file_path: Path, resource_name: str = "File") -> FileResponse:
    """
    Return a file response or raise 404 if file doesn't exist.
    Kept for backward compatibility - new code should use src.images.utils.get_file_response
    """
    from src.images.utils import get_file_response as new_get_file_response
    return new_get_file_response(file_path, resource_name)

def queue_image_processing(background_tasks, image_id: int, thumbnail_task, embedding_task):
    """
    Queue background tasks for image processing.
    Kept for backward compatibility - new code should use src.images.utils
    """
    from src.images.utils import queue_image_processing as new_queue
    new_queue(background_tasks, image_id, thumbnail_task, embedding_task)

def queue_multiple_image_processing(background_tasks, images: List[Image], thumbnail_task, embedding_task):
    """
    Queue background tasks for multiple images.
    Kept for backward compatibility - new code should use src.images.utils
    """
    from src.images.utils import queue_multiple_image_processing as new_queue_multiple
    new_queue_multiple(background_tasks, images, thumbnail_task, embedding_task)
