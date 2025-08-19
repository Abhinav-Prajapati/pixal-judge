import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse  # <-- This is the main missing import
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path

from database.database import get_db
from database.models import Image
from utils.file_handling import save_uploaded_file, setup_directories, delete_image_files # <-- Also import delete_image_files
from config import THUMB_DIR
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
            background_tasks.add_task(process_image_in_background, image_record.id)
            logger.info(f"Queued background processing for image_id: {image_record.id} ({file.filename})")
    
    if not saved_images:
        raise HTTPException(status_code=400, detail="No images were saved.")
    
    return saved_images

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