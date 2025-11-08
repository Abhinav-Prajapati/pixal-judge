"""Pydantic schemas for Batch domain."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from src.images.schemas import ImageResponse


class GroupAssociationResponse(BaseModel):
    """Image association within a batch with group metadata."""
    image: ImageResponse
    group_label: str | None
    quality_rank: int | None = None
    ranked_at: datetime | None = None
    ranking_metric: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


class BatchCreate(BaseModel):
    """Request to create a new batch."""
    name: str
    image_ids: List[int]


class BatchRename(BaseModel):
    """Request to rename a batch."""
    name: str


class BatchAnalyze(BaseModel):
    """Request to analyze batch with HDBSCAN parameters."""
    min_cluster_size: int = 5
    min_samples: int = 5
    metric: str = 'cosine'


class BatchUpdateImages(BaseModel):
    """Request to add/remove images from a batch."""
    image_ids: List[int]


class BatchResponse(BaseModel):
    """Full batch details with image associations."""
    id: int
    batch_name: str
    status: str
    parameters: Dict[str, Any] | None
    image_associations: List[GroupAssociationResponse]
    
    model_config = ConfigDict(from_attributes=True)


class BatchGroupUpdate(BaseModel):
    """Request to manually update batch group mappings."""
    group_map: Dict[str, List[int]]
