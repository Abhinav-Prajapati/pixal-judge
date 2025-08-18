"""
API endpoints for image-related operations. Uploading now triggers background processing.
"""
import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from utils.file_handling import save_uploaded_file, setup_directories
from .schemas import ImageResponse
from .tasks import process_image_in_background

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/images",
    tags=["Images"]
)

@router.post("/upload", response_model=List[ImageResponse])
def upload_images(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    files: List[UploadFile] = File(...)
):
    """
    Uploads one or more image files and triggers background processing for each.
    """
    setup_directories()
    
    saved_images = []
    logger.info(f"Received {len(files)} file(s) for upload.")

    for file in files:
        image_record = save_uploaded_file(file, db)
        if image_record:
            saved_images.append(image_record)
            # FIX: Only pass the image_id to the background task.
            background_tasks.add_task(process_image_in_background, image_record.id)
            logger.info(f"Queued background processing for image_id: {image_record.id} ({file.filename})")
    
    if not saved_images:
        raise HTTPException(status_code=400, detail="No images were saved.")
    
    return saved_images

@router.get("/", response_model=List[ImageResponse])
def get_all_images(db: Session = Depends(get_db)):
    """Retrieves a list of all images in the database."""
    logger.info("Fetching all image records.")
    from database.models import Image
    return db.query(Image).all()