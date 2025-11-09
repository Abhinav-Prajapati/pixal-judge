"""
Utility functions for Images domain.
"""
from pathlib import Path
from fastapi.responses import FileResponse
from typing import List

from src.images.models import Image
from src.images.exceptions import ImageFileNotFound


def get_file_response(file_path: Path, resource_name: str = "File") -> FileResponse:
    """
    Return a file response or raise 404 if file doesn't exist.
    
    Args:
        file_path: Path to the file
        resource_name: Name of the resource for error message
        
    Returns:
        FileResponse for the file
    """
    if not file_path.is_file():
        raise ImageFileNotFound(f"{resource_name} file not found on disk")
    return FileResponse(file_path)


def queue_image_tasks(images: List[Image], thumbnail_task, embedding_task):
    """Queue Celery tasks for processing multiple images."""
    for image in images:
        thumbnail_task.delay(image.id)
        embedding_task.delay(image.id)

