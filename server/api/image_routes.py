import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse 
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path

from database.database import get_db
from utils.file_handling import handle_uploaded_image, setup_directories, delete_image_files
from config import THUMB_DIR
from .schemas import ImageResponse
from database.models import Image as ImageModel
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
    Uploads one or more image files.
    - Saves new images and triggers background processing.
    - Detects duplicates based on file hash and returns existing image data.
    """
    setup_directories()
    
    results = []
    logger.info(f"Received {len(files)} file(s) for processing.")

    for file in files:
        try:
            result = handle_uploaded_image(file, db)
            results.append(result)

            # ONLY queue a background task if the image is newly created.
            # We can check if the result is an instance of our SQLAlchemy model.
            if isinstance(result, ImageModel):
                background_tasks.add_task(process_image_in_background, result.id)
                logger.info(f"Queued background processing for NEW image_id: {result.id} ({file.filename})")
        
        except Exception as e:
            # If handle_uploaded_image fails, we can skip this file and continue with others
            # Or raise an HTTPException. For batch uploads, continuing is often better.
            logger.error(f"Could not process file '{file.filename}'. Error: {e}. Skipping.")
            # Optionally, you can add an error response for this specific file to the results list.

    if not results:
        raise HTTPException(status_code=400, detail="No images were processed successfully.")
    
    return results

@router.get("/", response_model=List[ImageResponse])
def get_all_images(db: Session = Depends(get_db)):
    """Retrieves a list of all images in the database."""
    logger.info("Fetching all image records.")
    return db.query(Image).all()

@router.get("/{image_id}")
def get_image_file(image_id: int, db: Session = Depends(get_db)):
    """Returns the original image file."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    
    image_path = Path(image.file_path)
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file not found on disk.")
        
    return FileResponse(image_path)

@router.get("/thumbnail/{image_id}")
def get_thumbnail_file(image_id: int, db: Session = Depends(get_db)):
    """Returns the thumbnail file for an image."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    
    if not image.has_thumbnail:
        raise HTTPException(status_code=404, detail="Thumbnail does not exist for this image.")

    thumb_path = THUMB_DIR / image.filename
    if not thumb_path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail file not found on disk.")
        
    return FileResponse(thumb_path)

@router.delete("/{image_id}")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Deletes an image's database record and its physical files."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    
    # First, delete the physical files
    if not delete_image_files(image):
        raise HTTPException(status_code=500, detail="Failed to delete image files from disk.")
    
    # If file deletion is successful, delete the database record
    db.delete(image)
    db.commit()
    
    return {"message": f"Image ID {image_id} and its files have been deleted."}