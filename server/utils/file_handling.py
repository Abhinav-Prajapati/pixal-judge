"""
Handles all file system operations like saving, deleting, and thumbnailing images.
"""
import shutil
import uuid
import logging
import hashlib
from pathlib import Path
from fastapi import UploadFile
from PIL import Image, ImageOps
from sqlalchemy.orm import Session
from database.models import Image as ImageModel
from api.schemas import ImageResponse
from config import IMAGE_DIR, THUMB_DIR, THUMB_SIZES

logger = logging.getLogger(__name__)

def setup_directories():
    """Creates the necessary asset directories if they don't exist."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

def _calculate_file_hash(file: UploadFile) -> str:
    """Calculates the SHA-256 hash of a file in chunks."""
    sha256_hash = hashlib.sha256()
    for chunk in iter(lambda: file.file.read(4096), b""):
        sha256_hash.update(chunk)
    file.file.seek(0)
    return sha256_hash.hexdigest()

def handle_uploaded_image(file: UploadFile, db: Session) -> ImageModel | ImageResponse:
    """
    Hashes the file to check for duplicates.
    - If new, saves the file and creates a DB record.
    - If a duplicate, returns the existing image's data.
    """
    try:
        image_hash = _calculate_file_hash(file)
        existing_image = db.query(ImageModel).filter(ImageModel.image_hash == image_hash).first()
        if existing_image:
            logger.info(
                f"Duplicate found for '{file.filename}'. "
                f"Matches existing image_id: {existing_image.id} ({existing_image.filename})"
            )
            return ImageResponse(
                id=existing_image.id,
                filename=existing_image.filename,
                original_filename=file.filename,
                file_path=existing_image.file_path,
                has_thumbnail=existing_image.has_thumbnail,
                is_duplicate=True,
                message=f"Duplicate of existing image ID: {existing_image.id}"
            )

        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        image_path = IMAGE_DIR / unique_filename

        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        new_image = ImageModel(
            filename=unique_filename,
            original_filename=file.filename,
            file_path=str(image_path),
            file_size=image_path.stat().st_size,
            mime_type=file.content_type,
            image_hash=image_hash
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        logger.info(f"Successfully saved new file: {file.filename} as {unique_filename}")

        return new_image

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to process uploaded file {file.filename}: {e}")
        raise

def create_thumbnail(image_record: ImageModel):
    """
    Creates a thumbnail for an image, applying orientation-specific dimensions.
    """
    if image_record.has_thumbnail:
        print(f"Thumbnail already exists for {image_record.filename}")
        return

    image_path = Path(image_record.file_path)
    thumb_path = THUMB_DIR / image_record.filename

    try:
        with Image.open(image_path) as img:
            # auto-correct orientation using EXIF data
            img = ImageOps.exif_transpose(img)

            if img.width > img.height:
                target_size = (THUMB_SIZES["landscape"]["height"], THUMB_SIZES["landscape"]["width"])
            else:
                target_size = (THUMB_SIZES["portrait"]["height"], THUMB_SIZES["portrait"]["width"])

            thumb = img.resize(target_size, Image.Resampling.LANCZOS)

            if thumb.mode in ('RGBA', 'LA', 'P'):
                thumb = thumb.convert('RGB')

            thumb.save(thumb_path, "JPEG", quality=85)

        image_record.has_thumbnail = True
        print(f"Created thumbnail for {image_record.filename}")

    except Exception as e:
        print(f"Failed to create thumbnail for {image_path}: {e}")

def delete_image_files(image_record: ImageModel) -> bool:
    """Deletes the physical image and thumbnail files from the disk."""
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