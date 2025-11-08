"""
CRUD operations for Image entity.
This module is kept for backward compatibility.
New code should use src.images.crud instead.
"""
from sqlalchemy.orm import Session
from src.images.models import Image
from typing import List, Optional

# Re-export all functions from src.images.crud
from src.images.crud import (
    get,
    get_by_hash,
    get_multi,
    get_all,
    get_multi_by_ids,
    create,
    update,
    remove,
    get_without_thumbnails,
    get_without_embeddings
)

__all__ = [
    'get',
    'get_by_hash',
    'get_multi',
    'get_all',
    'get_multi_by_ids',
    'create',
    'update',
    'remove',
    'get_without_thumbnails',
    'get_without_embeddings'
]