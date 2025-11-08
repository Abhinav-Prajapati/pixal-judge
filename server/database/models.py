"""
Defines the SQLAlchemy ORM models for our database tables.
These classes map directly to the 'images' and 'image_batches' tables.
"""
import numpy as np
from sqlalchemy import (Column, Integer, String, LargeBinary, DateTime, Boolean, 
                        BigInteger, Table, ForeignKey, Float, Text)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.sql import func
from config import DB_SCHEMA

# Import Base from database to avoid circular imports
from database.database import Base

# Import Image from the new location for backward compatibility
from src.images.models import Image

# Re-export Image for backward compatibility
__all__ = ['Image', 'ImageBatch', 'ImageBatchAssociation', 'Base']


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

    images = association_proxy(
        "image_associations", "image",
        creator=lambda img: ImageBatchAssociation(image=img)
    )

    __table_args__ = {'schema': DB_SCHEMA}

class ImageBatchAssociation(Base):
    """This is the Association Object that links an Image to a Batch."""
    __tablename__ = 'image_batch_association'
    batch_id = Column(ForeignKey(f'{DB_SCHEMA}.image_batches.id'), primary_key=True)
    image_id = Column(ForeignKey(f'{DB_SCHEMA}.images.id'), primary_key=True)
    group_label = Column(String(50), nullable=True)
    
    # Quality ranking within group
    quality_rank = Column(Integer, nullable=True)
    ranked_at = Column(DateTime(timezone=True), nullable=True)
    ranking_metric = Column(String(50), nullable=True)

    batch = relationship("ImageBatch", back_populates="image_associations")
    image = relationship("Image", back_populates="batch_associations")
    
    __table_args__ = {'schema': DB_SCHEMA}