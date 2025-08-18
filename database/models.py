"""
Defines the SQLAlchemy ORM models for our database tables.
These classes map directly to the 'images' and 'clustering_results' tables.
"""
import numpy as np
from sqlalchemy import (Column, Integer, String, LargeBinary, DateTime, ForeignKey, Index)
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
from config import DB_SCHEMA

Base = declarative_base()

class Image(Base):
    """Represents an image file and its extracted feature vector."""
    __tablename__ = 'images'
    id = Column(Integer, primary_key=True)
    filepath = Column(String(1024), unique=True, nullable=False)
    _features = Column('features', LargeBinary, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    results = relationship("ClusteringResult", back_populates="image")

    @property
    def features(self) -> np.ndarray:
        """Deserializes the binary data back into a NumPy array."""
        return np.frombuffer(self._features, dtype=np.float32)

    @features.setter
    def features(self, value: np.ndarray):
        """Serializes a NumPy array into binary data for storage."""
        self._features = value.astype(np.float32).tobytes()

    __table_args__ = {'schema': DB_SCHEMA}


class ClusteringResult(Base):
    """Represents the result of a single image in a clustering run."""
    __tablename__ = 'clustering_results'
    id = Column(Integer, primary_key=True)
    run_id = Column(String(255), nullable=False)
    image_id = Column(Integer, ForeignKey(f'{DB_SCHEMA}.images.id', ondelete="CASCADE"), nullable=False)
    cluster_label = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    image = relationship("Image", back_populates="results")

    __table_args__ = (
        Index('idx_clustering_results_run_id', 'run_id'),
        {'schema': DB_SCHEMA}
    )
