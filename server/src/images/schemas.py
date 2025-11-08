"""
Pydantic schemas for Image domain.
Defines request and response models for API validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, Any


class ImageResponse(BaseModel):
    """Schema for returning image details."""
    id: int
    filename: str
    original_filename: str
    file_path: str
    has_thumbnail: bool
    is_duplicate: bool = False
    message: str | None = None
    quality_score: float | None = None
    quality_metric: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


class Metadata(BaseModel):
    """Schema for detailed image metadata."""
    width: Optional[int] = None
    height: Optional[int] = None
    orientation: Optional[int] = None
    shot_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    camera_make: Optional[str] = None
    camera_model: Optional[str] = None
    focal_length: Optional[str] = None
    f_number: Optional[float] = None
    exposure_time: Optional[str] = None
    iso: Optional[int] = None
    caption: Optional[str] = None
    tags: Optional[Any] = None
    rating: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class ImageQualityRequest(BaseModel):
    """Request model for quality analysis."""
    image_ids: list[int]
    metric: str = "brisque"


class ImageQualityResponse(BaseModel):
    """Response with image quality score."""
    image_id: int
    quality_score: float
    quality_metric: str
    analyzed_at: datetime
    file_name: str
