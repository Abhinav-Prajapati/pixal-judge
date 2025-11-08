"""
Backward compatibility layer for database models.
All models now live in their respective domain packages (src/{domain}/models.py).
"""
from database.database import Base
from src.images.models import Image
from src.batches.models import ImageBatch, ImageBatchAssociation

__all__ = ['Base', 'Image', 'ImageBatch', 'ImageBatchAssociation']