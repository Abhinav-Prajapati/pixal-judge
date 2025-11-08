"""CRUD operations for Batch domain."""
from sqlalchemy.orm import Session
from src.batches.models import ImageBatch, ImageBatchAssociation
from src.images.models import Image
from typing import List, Optional, Dict


def get(db: Session, batch_id: int) -> Optional[ImageBatch]:
    """Get batch by ID."""
    return db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()


def get_multi(db: Session, skip: int = 0, limit: int = 100) -> List[ImageBatch]:
    """Get multiple batches with pagination."""
    return db.query(ImageBatch).offset(skip).limit(limit).all()


def get_all(db: Session) -> List[ImageBatch]:
    """Get all batches."""
    return db.query(ImageBatch).all()


def create(db: Session, *, name: str, images: List[Image]) -> ImageBatch:
    """Create new batch with images."""
    new_batch = ImageBatch(batch_name=name, images=images, status='pending')
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch


def update(db: Session, *, db_obj: ImageBatch) -> ImageBatch:
    """Update batch."""
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def remove(db: Session, batch: ImageBatch):
    """Delete batch."""
    db.delete(batch)
    db.commit()


def get_associations_map(db: Session, batch_id: int) -> Dict[int, ImageBatchAssociation]:
    """Get image associations for a batch as a map."""
    associations = db.query(ImageBatchAssociation).filter(
        ImageBatchAssociation.batch_id == batch_id
    ).all()
    return {assoc.image_id: assoc for assoc in associations}
