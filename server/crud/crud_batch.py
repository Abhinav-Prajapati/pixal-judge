from sqlalchemy.orm import Session
from database.models import Image, ImageBatch, ImageBatchAssociation
from typing import List, Optional, Dict

def get(db: Session, batch_id: int) -> Optional[ImageBatch]:
    return db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()

def get_multi(db: Session) -> List[ImageBatch]:
    return db.query(ImageBatch).all()

def create(db: Session, *, name: str, images: List[Image]) -> ImageBatch:
    new_batch = ImageBatch(batch_name=name, images=images, status='pending')
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

def remove(db: Session, batch: ImageBatch):
    db.delete(batch)
    db.commit()

def update(db: Session, *, db_obj: ImageBatch) -> ImageBatch:
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_associations_map(db: Session, batch_id: int) -> Dict[int, ImageBatchAssociation]:
    associations = db.query(ImageBatchAssociation).filter(ImageBatchAssociation.batch_id == batch_id).all()
    return {assoc.image_id: assoc for assoc in associations}