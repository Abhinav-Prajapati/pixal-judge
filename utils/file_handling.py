"""
Handles all file system operations like saving, deleting, and thumbnailing images.
"""
import shutil
import uuid
from pathlib import Path
from PIL import Image, ImageOps
from sqlalchemy.orm import Session
from database.models import Image as ImageModel
from config import IMAGE_DIR, THUMB_DIR, THUMB_SIZES

def setup_directories():
    """Creates the necessary asset directories if they don't exist."""
    IMAGE_DIR.mkdir(parents=True, exist_ok=True)
    THUMB_DIR.mkdir(parents=True, exist_ok=True)

def save_image_from_path(source_path: Path, db: Session) -> ImageModel:
    """Copies an image from a local path to the assets folder and creates a DB record."""
    try:
        print( "fuck u python ",source_path.name)
        file_extension = source_path.suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        image_path = IMAGE_DIR / unique_filename
        
        shutil.copy2(source_path, image_path)

        new_image = ImageModel(
            filename=unique_filename,
            original_filename=source_path.name,
            file_path=str(image_path),
            file_size=image_path.stat().st_size,
            mime_type=f"image/{file_extension.strip('.')}"
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        print(f"Successfully saved image: {source_path.name} as {unique_filename}")
        return new_image
    except Exception as e:
        db.rollback()
        print(f"Failed to save file {source_path.name}: {e}")
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
            # First, auto-correct orientation using EXIF data
            img = ImageOps.exif_transpose(img)

            # Determine if the (corrected) image is landscape or portrait
            if img.width > img.height:
                # It's a landscape image
                target_size = (THUMB_SIZES["landscape"]["height"], THUMB_SIZES["landscape"]["width"])
            else:
                # It's a portrait or square image
                target_size = (THUMB_SIZES["portrait"]["height"], THUMB_SIZES["portrait"]["width"])

            thumb = img.resize(target_size, Image.Resampling.LANCZOS)

            if thumb.mode in ('RGBA', 'LA', 'P'):
                thumb = thumb.convert('RGB')

            thumb.save(thumb_path, "JPEG", quality=85)

        #image_record.has_thumbnail = True
        print(f"Created thumbnail for {image_record.filename}")

    except Exception as e:
        print(f"Failed to create thumbnail for {image_path}: {e}")