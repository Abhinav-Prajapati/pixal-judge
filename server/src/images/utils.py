"""
Utility functions for Images domain.
"""
from pathlib import Path
from fastapi import BackgroundTasks
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


def queue_image_processing(
    background_tasks: BackgroundTasks,
    image_id: int,
    thumbnail_task,
    embedding_task
):
    """
    Queue background tasks for processing a single image.
    
    Args:
        background_tasks: FastAPI background tasks
        image_id: ID of the image to process
        thumbnail_task: Thumbnail generation function
        embedding_task: Embedding generation function
    """
    background_tasks.add_task(thumbnail_task, image_id)
    background_tasks.add_task(embedding_task, image_id)


def queue_multiple_image_processing(
    background_tasks: BackgroundTasks,
    images: List[Image],
    thumbnail_task,
    embedding_task
):
    """
    Queue background tasks for processing multiple images.
    
    Args:
        background_tasks: FastAPI background tasks
        images: List of Image objects to process
        thumbnail_task: Thumbnail generation function
        embedding_task: Embedding generation function
    """
    for image in images:
        queue_image_processing(background_tasks, image.id, thumbnail_task, embedding_task)
