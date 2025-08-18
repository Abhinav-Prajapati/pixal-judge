"""
Defines Pydantic models for API request and response validation.
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class ImageResponse(BaseModel):
    """Schema for returning image details."""
    id: int
    filename: str
    original_filename: str
    file_path: str
    has_thumbnail: bool
    model_config = ConfigDict(from_attributes=True)

class BatchCreate(BaseModel):
    """Schema for the initial creation of a batch."""
    name: str
    image_ids: List[int]

class BatchAnalyze(BaseModel):
    """Schema for the analysis request."""
    eps: float = 0.3
    min_samples: int = 2
    metric: str = 'cosine'

class BatchUpdateImages(BaseModel):
    """Schema for adding/removing images from a batch."""
    image_ids: List[int]

class BatchResponse(BaseModel):
    """Schema for returning full batch details."""
    id: int
    batch_name: str
    status: str
    image_ids: List[int]
    parameters: Dict[str, Any] | None
    cluster_summary: Dict[str, Any] | None
    model_config = ConfigDict(from_attributes=True)