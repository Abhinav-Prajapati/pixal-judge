"""
SQLAlchemy ORM model for Image entity.
"""
import numpy as np
from sqlalchemy import Column, Integer, String, LargeBinary, DateTime, Boolean, BigInteger, Float, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.sql import func
from database.database import Base
from config import DB_SCHEMA


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

    # Essential Attributes
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    orientation = Column(Integer, default=1, nullable=True) 
    shot_at = Column(DateTime(timezone=True), nullable=True) 

    # Geolocation Data
    latitude = Column(Float, nullable=True) 
    longitude = Column(Float, nullable=True)

    # Camera & Exposure Details
    camera_make = Column(String(100), nullable=True)
    camera_model = Column(String(100), nullable=True)
    focal_length = Column(String(50), nullable=True)
    f_number = Column(Float, nullable=True)
    exposure_time = Column(String(50), nullable=True)
    iso = Column(Integer, nullable=True)

    # User-Generated & Derived Data
    caption = Column(Text, nullable=True)
    tags = Column(JSONB, nullable=True) 
    rating = Column(Integer, nullable=True) 

    # Image Quality Assessment
    quality_score = Column(Float, nullable=True)
    quality_metric = Column(String(50), nullable=True)
    quality_analyzed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships - will be imported from other modules when they're created
    batch_associations = relationship("ImageBatchAssociation", back_populates="image")
    
    batches = association_proxy(
        "batch_associations", "batch",
        creator=lambda bch: ImageBatchAssociation(batch=bch)
    )

    @property
    def features(self) -> np.ndarray:
        """Get features as numpy array."""
        if self._features is None:
            return None
        return np.frombuffer(self._features, dtype=np.float32)

    @features.setter
    def features(self, value: np.ndarray):
        """Set features from numpy array."""
        if value is None:
            self._features = None
        else:
            self._features = value.astype(np.float32).tobytes()

    __table_args__ = {'schema': DB_SCHEMA}
