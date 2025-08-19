# File: database/models.py
"""
Defines the SQLAlchemy ORM models for our database tables.
These classes map directly to the 'images' and 'image_batches' tables.
"""
import numpy as np
from sqlalchemy import (Column, Integer, String, LargeBinary, DateTime, Index, Boolean, BigInteger)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func
from config import DB_SCHEMA

Base = declarative_base()

class Image(Base):
    """Represents an image file and its associated metadata and features."""
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), unique=True, nullable=False)
    original_filename = Column(String(1024), nullable=False)
    file_path = Column(String(1024), unique=True, nullable=False)
    file_size = Column(BigInteger)
    mime_type = Column(String(255))
    has_thumbnail = Column(Boolean, default=False)
    _features = Column('features', LargeBinary, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    @property
    def features(self) -> np.ndarray:
        """Deserializes the binary data back into a NumPy array."""
        if self._features is None:
            return None
        return np.frombuffer(self._features, dtype=np.float32)

    @features.setter
    def features(self, value: np.ndarray):
        """Serializes a NumPy array into binary data for storage."""
        if value is None:
            self._features = None
        else:
            self._features = value.astype(np.float32).tobytes()

    __table_args__ = {'schema': DB_SCHEMA}


class ImageBatch(Base):
    """Represents a batch of images and their collective clustering results."""
    __tablename__ = 'image_batches'
    id = Column(Integer, primary_key=True)
    batch_name = Column(String(255), nullable=False)
    image_ids = Column(ARRAY(Integer), nullable=False)
    cluster_summary = Column(JSONB)
    parameters = Column(JSONB)
    status = Column(String(50), default='pending', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = {'schema': DB_SCHEMA}