"""SQLAlchemy models for Batch domain."""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.sql import func

from database import Base
from config import DB_SCHEMA


class ImageBatch(Base):
    """Image batch with clustering/grouping metadata."""
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
    """Association linking Images to Batches with clustering metadata."""
    __tablename__ = 'image_batch_association'
    
    batch_id = Column(ForeignKey(f'{DB_SCHEMA}.image_batches.id'), primary_key=True)
    image_id = Column(ForeignKey(f'{DB_SCHEMA}.images.id'), primary_key=True)
    group_label = Column(String(50), nullable=True)
    
    quality_rank = Column(Integer, nullable=True)
    ranked_at = Column(DateTime(timezone=True), nullable=True)
    ranking_metric = Column(String(50), nullable=True)

    batch = relationship("ImageBatch", back_populates="image_associations")
    image = relationship("Image", back_populates="batch_associations")
    
    __table_args__ = {'schema': DB_SCHEMA}
