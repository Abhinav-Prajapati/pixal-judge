"""
Defines Pydantic models for API request and response validation.
"""
from pydantic import BaseModel
from typing import List, Dict, Any

class ImageResponse(BaseModel):
    """Schema for returning image details."""
    id: int
    filename: str
    original_filename: str
    file_path: str
    has_thumbnail: bool

class BatchCreate(BaseModel):
    """Schema for the request body to create a new batch."""
    name: str
    image_ids: List[int]
    eps: float = 0.3
    min_samples: int = 2
    metric: str = 'cosine'

class BatchResponse(BaseModel):
    """Schema for returning batch details."""
    id: int
    batch_name: str
    status: str
    parameters: Dict[str, Any]
    cluster_summary: Dict[str, Any] | None
