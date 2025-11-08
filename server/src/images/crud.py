"""
CRUD operations for Image entity.
Handles database operations for images.
"""
from sqlalchemy.orm import Session
from src.images.models import Image
from typing import List, Optional


def get(db: Session, image_id: int) -> Optional[Image]:
    """Get a single image by ID."""
    return db.query(Image).filter(Image.id == image_id).first()


def get_by_hash(db: Session, image_hash: str) -> Optional[Image]:
    """Get an image by its file hash."""
    return db.query(Image).filter(Image.image_hash == image_hash).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100) -> List[Image]:
    """Get multiple images with pagination."""
    return db.query(Image).offset(skip).limit(limit).all()


def get_all(db: Session) -> List[Image]:
    """Get all images."""
    return db.query(Image).all()


def get_multi_by_ids(db: Session, image_ids: List[int]) -> List[Image]:
    """Get multiple images by their IDs."""
    return db.query(Image).filter(Image.id.in_(image_ids)).all()


def create(db: Session, image_data: dict) -> Image:
    """Create a new image record."""
    new_image = Image(**image_data)
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image


def update(db: Session, image: Image, update_data: dict) -> Image:
    """Update an existing image record."""
    for key, value in update_data.items():
        if hasattr(image, key):
            setattr(image, key, value)
    db.commit()
    db.refresh(image)
    return image


def remove(db: Session, image: Image):
    """Delete an image record."""
    db.delete(image)
    db.commit()


def get_without_thumbnails(db: Session) -> List[Image]:
    """Get all images that don't have thumbnails yet."""
    return db.query(Image).filter(Image.has_thumbnail == False).all()


def get_without_embeddings(db: Session) -> List[Image]:
    """Get all images that don't have feature embeddings yet."""
    return db.query(Image).filter(Image._features.is_(None)).all()
