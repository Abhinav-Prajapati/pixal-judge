"""
API endpoints for image-related operations: uploading and processing.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from database.models import Image
from utils.file_handling import save_image_from_path, create_thumbnail
from processing.feature_extraction import ImageFeatureExtractor
from .schemas import ImageResponse
from pathlib import Path
import torch


router = APIRouter(
    prefix="/images",
    tags=["Images"]
)

@router.post("/upload", response_model=List[ImageResponse])
def upload_images(db: Session = Depends(get_db), files: List[UploadFile] = File(...)):
    """Uploads one or more image files."""
    saved_images = []
    for file in files:
        temp_path = Path(f"/tmp/{file.filename}")
        with open(temp_path, "wb") as buffer:
            buffer.write(file.file.read())
        
        # Now pass the Path object to the function
        image_record = save_image_from_path(temp_path, db)
        saved_images.append(image_record)
    
    if not saved_images:
        raise HTTPException(status_code=400, detail="No images were saved.")
    return saved_images

@router.post("/process") # NOTE: this should be trigger as a queue task that runs in backgroud 
def process_images(db: Session = Depends(get_db)):
    """Triggers thumbnail and embedding creation for all unprocessed images."""
    # Create Thumbnails
    images_no_thumb = db.query(Image).filter_by(has_thumbnail=False).all()
    for image in images_no_thumb:
        create_thumbnail(image)
    
    # Create Embeddings
    images_no_features = db.query(Image).filter(Image._features == None).all()
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    extractor = ImageFeatureExtractor(device=device)
    for image in images_no_features:
        features = extractor.extract_features(image.file_path)
        if features is not None:
            image.features = features
            
    db.commit()
    return {
        "message": "Processing complete.",
        "thumbnails_created": len(images_no_thumb),
        "embeddings_created": len(images_no_features)
    }

@router.get("/", response_model=List[ImageResponse])
def get_all_images(db: Session = Depends(get_db)):
    """Retrieves a list of all images in the database."""
    return db.query(Image).all()