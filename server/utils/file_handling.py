"""
Handles all file system operations like saving, deleting, and thumbnailing images.
This module is decoupled from the database and business logic.
"""
import shutil
import uuid
import logging
import hashlib
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, ImageOps

# Local application imports
from database.models import Image as ImageModel
from config import IMAGE_DIR, THUMB_DIR, THUMB_SIZES

logger = logging.getLogger(__name__)

def setup_directories():
    """Creates the necessary asset directories if they don't exist."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

def _calculate_file_hash(file: UploadFile) -> str:
    """
    Calculates the SHA-256 hash of a file in chunks to handle large files efficiently.
    Resets the file pointer to the beginning after reading.
    """
    sha256_hash = hashlib.sha256()
    # Read the file in 4KB chunks
    for chunk in iter(lambda: file.file.read(4096), b""):
        sha256_hash.update(chunk)
    # Reset file pointer to the start for subsequent operations
    file.file.seek(0)
    return sha256_hash.hexdigest()

def save_uploaded_file(file: UploadFile) -> tuple[Path, str]:
    """
    Saves an uploaded file to the designated image directory with a unique name.

    Args:
        file: The uploaded file object from FastAPI.

    Returns:
        A tuple containing the full path to the saved image and its unique filename.
    """
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    image_path = IMAGE_DIR / unique_filename

    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    logger.info(f"Saved file '{file.filename}' as '{unique_filename}'")
    return image_path, unique_filename

def create_thumbnail(image_record: ImageModel):
    """
    Creates a thumbnail for an image, applying orientation-specific dimensions.
    It reads the EXIF data to correctly orient the image before thumbnailing.
    """
    if image_record.has_thumbnail:
        logger.debug(f"Thumbnail already exists for {image_record.filename}")
        return

    image_path = Path(image_record.file_path)
    thumb_path = THUMB_DIR / image_record.filename

    try:
        with Image.open(image_path) as img:
            # Auto-correct orientation using EXIF data before resizing
            img = ImageOps.exif_transpose(img)

            # Determine target size based on aspect ratio
            if img.width > img.height:
                target_size = (THUMB_SIZES["landscape"]["height"], THUMB_SIZES["landscape"]["width"])
            else:
                target_size = (THUMB_SIZES["portrait"]["height"], THUMB_SIZES["portrait"]["width"])

            thumb = img.resize(target_size, Image.Resampling.LANCZOS)

            # Ensure the image is in RGB format before saving as JPEG
            if thumb.mode in ('RGBA', 'LA', 'P'):
                thumb = thumb.convert('RGB')

            thumb.save(thumb_path, "JPEG", quality=85)

            # This flag will be committed by the calling service
            image_record.has_thumbnail = True
            logger.info(f"Created thumbnail for {image_record.filename}")

    except Exception as e:
        logger.error(f"Failed to create thumbnail for {image_path}: {e}")

def delete_image_files(image_record: ImageModel) -> bool:
    """
    Deletes the physical image and its corresponding thumbnail file from the disk.
    """
    try:
        image_path = Path(image_record.file_path)
        thumb_path = THUMB_DIR / image_record.filename

        if image_path.exists():
            image_path.unlink()
            logger.info(f"Deleted image file: {image_path}")

        if thumb_path.exists():
            thumb_path.unlink()
            logger.info(f"Deleted thumbnail file: {thumb_path}")
            
        return True
    except Exception as e:
        logger.error(f"Error deleting files for image ID {image_record.id}: {e}")
        return False
