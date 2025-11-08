"""
Image service module.
This module is kept for backward compatibility.
New code should use src.images.service instead.
"""
import logging
from fastapi import UploadFile
from sqlalchemy.orm import Session
from typing import List, Union
from datetime import datetime, timezone

# Re-export all functions from src.images.service
from src.images.service import (
    process_new_uploads,
    delete_image_and_files,
    analyze_image_quality,
    get_by_id,
    get_all
)

__all__ = [
    'process_new_uploads',
    'delete_image_and_files',
    'analyze_image_quality',
    'get_by_id',
    'get_all'
]