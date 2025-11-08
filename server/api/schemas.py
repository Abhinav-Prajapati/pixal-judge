"""
Backward compatibility layer for API schemas.
All schemas now live in their respective domain packages (src/{domain}/schemas.py).
"""
from src.images.schemas import ImageResponse, Metadata, ImageQualityRequest, ImageQualityResponse
from src.batches.schemas import (
    GroupAssociationResponse,
    BatchCreate, 
    BatchRename,
    BatchAnalyze,
    BatchUpdateImages,
    BatchResponse,
    BatchGroupUpdate
)

__all__ = [
    'ImageResponse', 
    'Metadata', 
    'ImageQualityRequest', 
    'ImageQualityResponse',
    'GroupAssociationResponse', 
    'BatchCreate', 
    'BatchRename', 
    'BatchAnalyze',
    'BatchUpdateImages', 
    'BatchResponse', 
    'BatchGroupUpdate'
]
