"""
Defines Pydantic models for API request and response validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional

class ImageResponse(BaseModel):
    """Schema for returning image details. This model is unchanged."""
    id: int
    filename: str
    original_filename: str
    file_path: str
    has_thumbnail: bool
    is_duplicate: bool = False
    message: str | None = None
    model_config = ConfigDict(from_attributes=True)

class GroupAssociationResponse(BaseModel):
    """Schema for an image's association within a batch, including its group."""
    image: ImageResponse
    group_label: str | None
    model_config = ConfigDict(from_attributes=True)

class BatchCreate(BaseModel):
    """Schema for the initial creation of a batch."""
    name: str
    image_ids: List[int]

class BatchRename(BaseModel):
    """Schema for renaming a batch."""
    name: str

class BatchAnalyze(BaseModel):
    """Schema for the analysis request using HDBSCAN parameters."""
    min_cluster_size: int = 5
    min_samples: int = 5
    metric: str = 'cosine'

class BatchUpdateImages(BaseModel):
    """Schema for adding/removing images from a batch."""
    image_ids: List[int]

class BatchResponse(BaseModel):
    """Schema for returning full batch details."""
    id: int
    batch_name: str
    status: str
    parameters: Dict[str, Any] | None
    image_associations: List[GroupAssociationResponse]
    model_config = ConfigDict(from_attributes=True)

class BatchGroupUpdate(BaseModel):
    """Schema for manually updating a batch's group map."""
    group_map: Dict[str, List[int]]

class Metadata(BaseModel):
    """Schema for detailed image metadata."""
    width: Optional[int]
    height: Optional[int]
    orientation: Optional[int]
    shot_at: Optional[datetime]
    latitude: Optional[float]
    longitude: Optional[float]
    camera_make: Optional[str]
    camera_model: Optional[str]
    focal_length: Optional[str]
    f_number: Optional[float]
    exposure_time: Optional[str]
    iso: Optional[int]
    caption: Optional[str]
    tags: Optional[Any] 
    rating: Optional[int]