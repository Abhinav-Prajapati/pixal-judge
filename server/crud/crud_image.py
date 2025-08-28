from sqlalchemy.orm import Session
from database.models import Image
from typing import List, Optional

def get(db: Session, image_id: int) -> Optional[Image]:
    return db.query(Image).filter(Image.id == image_id).first()

def get_by_hash(db: Session, image_hash: str) -> Optional[Image]:
    return db.query(Image).filter(Image.image_hash == image_hash).first()

def get_multi(db: Session) -> List[Image]:
    return db.query(Image).all()

def get_multi_by_ids(db: Session, image_ids: List[int]) -> List[Image]:
    return db.query(Image).filter(Image.id.in_(image_ids)).all()

def create(db: Session, image_data: dict) -> Image:
    new_image = Image(**image_data)
    db.add(new_image)
    db.commit()
    db.refresh(new_image)
    return new_image

def remove(db: Session, image: Image):
    db.delete(image)
    db.commit()

def get_without_thumbnails(db: Session) -> List[Image]:
    """Retrieves all images that are missing a thumbnail."""
    return db.query(Image).filter(Image.has_thumbnail == False).all()

def get_without_embeddings(db: Session) -> List[Image]:
    """Retrieves all images that are missing feature embeddings."""
    return db.query(Image).filter(Image._features.is_(None)).all()