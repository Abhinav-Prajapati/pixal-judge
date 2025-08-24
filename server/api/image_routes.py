import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path

from database.database import get_db
from services import image_service
from crud import crud_image
from .schemas import ImageResponse
from .tasks import generate_thumbnail_task, generate_embedding_task, extract_metadata_task
from database.models import Image as ImageModel
from config import THUMB_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/upload", response_model=List[ImageResponse], operation_id="uploadImages")
def upload_images(
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    files: List[UploadFile] = File(...)
):
    """
    Uploads one or more image files. For each new image, it queues background
    tasks for metadata extraction, thumbnail generation, and feature embedding.
    """
    results = image_service.process_new_uploads(db=db, files=files)
    
    if not results:
        raise HTTPException(status_code=400, detail="No images were processed successfully.")
    
    for res in results:
        if isinstance(res, ImageModel):
            image_id = res.id
            logger.info(f"Queuing background tasks for NEW image_id: {image_id}")
            background_tasks.add_task(generate_thumbnail_task, image_id)
            background_tasks.add_task(generate_embedding_task, image_id)
            
    return results

@router.get("/", response_model=List[ImageResponse], operation_id="getAllImages")
def get_all_images(db: Session = Depends(get_db)):
    return crud_image.get_multi(db)

@router.get("/{image_id}", operation_id="getImageFile")
def get_image_file(image_id: int, db: Session = Depends(get_db)):
    image = crud_image.get(db, image_id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    image_path = Path(image.file_path)
    if not image_path.is_file():
        raise HTTPException(status_code=404, detail="Image file not found on disk.")
    return FileResponse(image_path)

@router.get("/thumbnail/{image_id}", operation_id="getImageThumbnail")
def get_thumbnail_file(image_id: int, db: Session = Depends(get_db)):
    image = crud_image.get(db, image_id=image_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found.")
    if not image.has_thumbnail:
        raise HTTPException(status_code=404, detail="Thumbnail does not exist for this image.")
    thumb_path = THUMB_DIR / image.filename
    if not thumb_path.is_file():
        raise HTTPException(status_code=404, detail="Thumbnail file not found on disk.")
    return FileResponse(thumb_path)

@router.delete("/{image_id}", operation_id="deleteImage")
def delete_image(image_id: int, db: Session = Depends(get_db)):
    try:
        image_service.delete_image_and_files(db=db, image_id=image_id)
        return {"message": f"Image ID {image_id} and its files have been deleted."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except IOError as e:
        raise HTTPException(status_code=500, detail=str(e))