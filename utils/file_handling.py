"""
Handles all file system operations like saving, deleting, and thumbnailing images.
"""
import shutil
import uuid
import logging
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, ImageOps
from sqlalchemy.orm import Session
from database.models import Image as ImageModel
from config import IMAGE_DIR, THUMB_DIR, THUMB_SIZES

logger = logging.getLogger(__name__)

def setup_directories():
    """Creates the necessary asset directories if they don't exist."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

def save_uploaded_file(file: UploadFile, db: Session) -> ImageModel:
    """Saves an uploaded file directly to the assets folder and creates a DB record."""
    try:
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        image_path = IMAGE_DIR / unique_filename

        # Stream the file content directly to the final destination
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_image = ImageModel(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=str(image_path),
            file_size=image_path.stat().st_size,
            mime_type=file.content_type
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        logger.info(f"Successfully saved uploaded file: {file.filename} as {unique_filename}")
        return new_image
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save uploaded file {file.filename}: {e}")
        raise

def create_thumbnail(image_record: ImageModel):
    """Creates a thumbnail for an image, applying orientation-specific dimensions."""
    if image_record.has_thumbnail:
        logger.info(f"Thumbnail already exists for {image_record.filename}")
        return

    image_path = Path(image_record.file_path)
    thumb_path = THUMB_DIR / image_record.filename

    try:
        with Image.open(image_path) as img:
            img = ImageOps.exif_transpose(img)

            if img.width > img.height:
                target_size = (THUMB_SIZES["landscape"]["width"], THUMB_SIZES["landscape"]["height"])
            else:
                target_size = (THUMB_SIZES["portrait"]["width"], THUMB_SIZES["portrait"]["height"])

            thumb = img.resize(target_size, Image.Resampling.LANCZOS)

            if thumb.mode in ('RGBA', 'LA', 'P'):
                thumb = thumb.convert('RGB')

            thumb.save(thumb_path, "JPEG", quality=85)

        image_record.has_thumbnail = True
        logger.info(f"Created thumbnail for {image_record.filename}")

    except Exception as e:
        logger.error(f"Failed to create thumbnail for {image_path}: {e}")