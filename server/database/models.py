"""
Defines the SQLAlchemy ORM models for our database tables.
These classes map directly to the 'images' and 'image_batches' tables.
"""
import numpy as np
from sqlalchemy import (Column, Integer, String, LargeBinary, DateTime, Boolean, 
                        BigInteger, Table, ForeignKey)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.sql import func
from config import DB_SCHEMA

Base = declarative_base()

class ImageBatchAssociation(Base):
    """This is the Association Object that links an Image to a Batch."""
    __tablename__ = 'image_batch_association'
    batch_id = Column(ForeignKey(f'{DB_SCHEMA}.image_batches.id'), primary_key=True)
    image_id = Column(ForeignKey(f'{DB_SCHEMA}.images.id'), primary_key=True)
    group_label = Column(String(50), nullable=True)

    batch = relationship("ImageBatch", back_populates="image_associations")
    image = relationship("Image", back_populates="batch_associations")
    
    __table_args__ = {'schema': DB_SCHEMA}


class Image(Base):
    """Represents an image file and its associated metadata and features."""
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), unique=True, nullable=False)
    original_filename = Column(String(1024), nullable=False)
    file_path = Column(String(1024), unique=True, nullable=False)
    image_hash = Column(String(255), unique=True, nullable=False)
    file_size = Column(BigInteger)
    mime_type = Column(String(255))
    has_thumbnail = Column(Boolean, default=False)
    _features = Column('features', LargeBinary, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch_associations = relationship("ImageBatchAssociation", back_populates="image")
    
    batches = association_proxy(
        "batch_associations", "batch",
        creator=lambda bch: ImageBatchAssociation(batch=bch)
    )

    @property
    def features(self) -> np.ndarray:
        if self._features is None: return None
        return np.frombuffer(self._features, dtype=np.float32)

    @features.setter
    def features(self, value: np.ndarray):
        if value is None: self._features = None
        else: self._features = value.astype(np.float32).tobytes()

    __table_args__ = {'schema': DB_SCHEMA}


class ImageBatch(Base):
    """Represents a grouping of images and their collective analysis results."""
    __tablename__ = 'image_batches'
    id = Column(Integer, primary_key=True)
    batch_name = Column(String(255), nullable=False)
    parameters = Column(JSONB)
    status = Column(String(50), default='pending', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    image_associations = relationship(
        "ImageBatchAssociation",
        back_populates="batch",
        cascade="all, delete-orphan"
    )

    # ADDED creator ARGUMENT
    images = association_proxy(
        "image_associations", "image",
        creator=lambda img: ImageBatchAssociation(image=img)
    )

    __table_args__ = {'schema': DB_SCHEMA}