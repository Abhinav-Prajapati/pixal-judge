"""
Business logic for Images domain.
Orchestrates operations between CRUD, file handling, and processing.
"""
import logging
from fastapi import UploadFile
from sqlalchemy.orm import Session
from typing import List, Union
from datetime import datetime, timezone

from src.images import crud, schemas
from src.images.models import Image
from src.images.exceptions import ImageNotFound
from utils.file_handling import save_uploaded_file, _calculate_file_hash, delete_image_files
from src.processing.metadata import extract_exif_data
from src.processing.quality import ImageQualityAnalyzer

logger = logging.getLogger(__name__)


def process_new_uploads(
    db: Session,
    files: List[UploadFile]
) -> List[Union[Image, schemas.ImageResponse]]:
    """
    Orchestrates the entire image upload process.
    
    Args:
        db: Database session
        files: List of uploaded files
        
    Returns:
        List of created Image objects or ImageResponse schemas for duplicates
    """
    results = []
    
    for file in files:
        try:
            # Calculate hash to check for duplicates
            image_hash = _calculate_file_hash(file)
            existing_image = crud.get_by_hash(db, image_hash=image_hash)

            if existing_image:
                logger.info(f"Duplicate found for '{file.filename}'. Matches ID: {existing_image.id}")
                results.append(schemas.ImageResponse(
                    id=existing_image.id,
                    filename=existing_image.filename,
                    original_filename=file.filename,
                    file_path=existing_image.file_path,
                    has_thumbnail=existing_image.has_thumbnail,
                    is_duplicate=True,
                    message=f"Duplicate of existing image ID: {existing_image.id}"
                ))
                continue

            # Save file to disk
            image_path, unique_filename = save_uploaded_file(file)
            
            # Extract metadata
            metadata = extract_exif_data(str(image_path))
            
            # Prepare image data
            image_data = {
                "filename": unique_filename,
                "original_filename": file.filename,
                "file_path": str(image_path),
                "file_size": image_path.stat().st_size,
                "mime_type": file.content_type,
                "image_hash": image_hash,
                **metadata
            }
            
            # Create database record
            new_image = crud.create(db, image_data=image_data)
            logger.info(f"Saved new file: {file.filename} as {unique_filename}")
            results.append(new_image)
            
        except Exception as e:
            logger.error(f"Could not process file '{file.filename}'. Error: {e}. Skipping.")
            
    return results


def delete_image_and_files(db: Session, image_id: int) -> Image:
    """
    Orchestrates the deletion of an image from the DB and disk.
    
    Args:
        db: Database session
        image_id: ID of image to delete
        
    Returns:
        Deleted Image object
        
    Raises:
        ImageNotFound: If image doesn't exist
        IOError: If file deletion fails
    """
    image = crud.get(db, image_id=image_id)
    if not image:
        raise ImageNotFound(image_id)
        
    if not delete_image_files(image):
        raise IOError("Failed to delete image files from disk.")
        
    crud.remove(db, image=image)
    return image


def analyze_image_quality(
    db: Session,
    image_id: int,
    metric: str = 'clipiqa+',
    force_reanalyze: bool = False
) -> float:
    """
    Analyze image quality using PyIQA. Returns cached score if available.
    
    Args:
        db: Database session
        image_id: ID of image to analyze
        metric: PyIQA metric to use
        force_reanalyze: If True, recalculate even if score exists
        
    Returns:
        Quality score (float)
        
    Raises:
        ImageNotFound: If image doesn't exist
    """
    image = crud.get(db, image_id=image_id)
    if not image:
        raise ImageNotFound(image_id)
    
    # Return cached score if available and metric matches
    if not force_reanalyze and image.quality_score is not None:
        if image.quality_metric == metric:
            logger.info(f"Returning cached quality score for image {image_id}")
            return image.quality_score
    
    # Calculate new quality score
    logger.info(f"Analyzing quality for image {image_id} with metric {metric}")
    analyzer = ImageQualityAnalyzer(metric)
    score = analyzer.analyze(image.file_path)
    
    # Update image record
    image.quality_score = score
    image.quality_metric = metric
    image.quality_analyzed_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(image)
    
    logger.info(f"Stored quality score {score:.4f} for image {image_id}")
    return score


def get_by_id(db: Session, image_id: int) -> Image:
    """
    Get an image by ID.
    
    Args:
        db: Database session
        image_id: ID of image
        
    Returns:
        Image object
        
    Raises:
        ImageNotFound: If image doesn't exist
    """
    image = crud.get(db, image_id=image_id)
    if not image:
        raise ImageNotFound(image_id)
    return image


def get_all(db: Session) -> List[Image]:
    """
    Get all images.
    
    Args:
        db: Database session
        
    Returns:
        List of Image objects
    """
    return crud.get_all(db)
