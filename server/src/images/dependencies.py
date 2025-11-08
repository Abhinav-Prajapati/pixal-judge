"""
FastAPI dependencies for Images domain.
Reusable dependency functions for route validation.
"""
from fastapi import Depends
from sqlalchemy.orm import Session
from pathlib import Path

from database import get_db
from src.images import crud
from src.images.models import Image
from src.images.exceptions import ImageNotFound, ImageFileNotFound, ThumbnailNotFound
from config import THUMB_DIR


def get_image_or_404(image_id: int, db: Session = Depends(get_db)) -> Image:
    """
    Dependency to validate that an image exists.
    Returns the image object or raises 404.
    """
    image = crud.get(db, image_id=image_id)
    if not image:
        raise ImageNotFound(image_id)
    return image


def validate_image_file_exists(image: Image = Depends(get_image_or_404)) -> Image:
    """
    Dependency to validate that the image file exists on disk.
    """
    file_path = Path(image.file_path)
    if not file_path.is_file():
        raise ImageFileNotFound(f"Image file not found: {file_path}")
    return image


def validate_thumbnail_exists(image: Image = Depends(get_image_or_404)) -> Image:
    """
    Dependency to validate that the thumbnail exists.
    """
    if not image.has_thumbnail:
        raise ThumbnailNotFound()
    
    thumbnail_path = THUMB_DIR / image.filename
    if not thumbnail_path.is_file():
        raise ImageFileNotFound(f"Thumbnail file not found on disk")
    
    return image
