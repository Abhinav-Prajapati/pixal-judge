"""
FastAPI router for Images domain.
Defines all image-related API endpoints.
"""
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path

from database.database import get_db
from src.images import service, schemas
from src.images.dependencies import get_image_or_404, validate_thumbnail_exists
from src.images.models import Image
from api.tasks import generate_thumbnail_task, generate_embedding_task
from src.images.utils import get_file_response, queue_multiple_image_processing
from config import THUMB_DIR

logger = logging.getLogger(__name__)

# Create router with exact same prefix and tags as original
router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/upload", response_model=List[schemas.ImageResponse], operation_id="uploadImages")
def upload_images(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    files: List[UploadFile] = File(...)
):
    """Uploads one or more image files and processes them in the background."""
    results = service.process_new_uploads(db=db, files=files)
    
    if not results:
        raise HTTPException(status_code=400, detail="No images were processed successfully.")
    
    # Queue background tasks for new images only
    new_images = [res for res in results if isinstance(res, Image)]
    queue_multiple_image_processing(
        background_tasks,
        new_images,
        generate_thumbnail_task,
        generate_embedding_task
    )
    
    return results


@router.get("/", response_model=List[schemas.ImageResponse], operation_id="getAllImages")
def get_all_images(db: Session = Depends(get_db)):
    """Get all images."""
    return service.get_all(db)


@router.get("/{image_id}", operation_id="getImageFile")
def get_image_file(image: Image = Depends(get_image_or_404)):
    """Returns the full-size image file."""
    return get_file_response(Path(image.file_path), "Image")


@router.get("/thumbnail/{image_id}", operation_id="getImageThumbnail")
def get_thumbnail_file(image: Image = Depends(validate_thumbnail_exists)):
    """Returns the thumbnail image file."""
    return get_file_response(THUMB_DIR / image.filename, "Thumbnail")


@router.delete("/{image_id}", operation_id="deleteImage")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image and its files."""
    try:
        service.delete_image_and_files(db=db, image_id=image_id)
        return {"message": f"Image ID {image_id} and its files have been deleted."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IOError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metadata/{image_id}", response_model=schemas.Metadata, operation_id="getImageMetadata")
def get_image_metadata(image: Image = Depends(get_image_or_404)):
    """Returns detailed EXIF metadata for an image."""
    return schemas.Metadata.model_validate(image)


@router.get("/quality/{image_id}", response_model=schemas.ImageQualityResponse)
async def get_image_quality(
    image_id: int,
    metric: str = "brisque",
    force_reanalyze: bool = False,
    db: Session = Depends(get_db),
):
    """
    Get or calculate image quality score.
    
    - Returns cached score if available and metric matches
    - Calculates new score if not cached or force_reanalyze=True
    - Supported metrics: liqe, clipiqa+, brisque, niqe, musiq, cnniqa
    """
    try:
        score = service.analyze_image_quality(db, image_id, metric, force_reanalyze)
        image = service.get_by_id(db, image_id)
        
        return schemas.ImageQualityResponse(
            image_id=image.id,
            quality_score=score,
            quality_metric=image.quality_metric,
            analyzed_at=image.quality_analyzed_at,
            file_name=image.original_filename
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing image quality: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image quality")


@router.post("/quality/batch", response_model=List[schemas.ImageQualityResponse], operation_id="analyzeBatchQuality")
def analyze_batch_quality(
    image_ids: List[int],
    metric: str = 'liqe',
    force_reanalyze: bool = False,
    db: Session = Depends(get_db)
):
    """Analyze quality for multiple images at once."""
    results = []
    errors = []
    
    for image_id in image_ids:
        try:
            score = service.analyze_image_quality(db, image_id, metric, force_reanalyze)
            image = service.get_by_id(db, image_id)
            results.append(schemas.ImageQualityResponse(
                image_id=image.id,
                quality_score=score,
                quality_metric=image.quality_metric,
                analyzed_at=image.quality_analyzed_at,
                file_name=image.original_filename
            ))
        except Exception as e:
            errors.append(f"Image {image_id}: {str(e)}")
            logger.error(f"Error analyzing image {image_id}: {e}")
    
    if errors and not results:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze all images: {'; '.join(errors)}"
        )
    
    return results
