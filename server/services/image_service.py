import logging
from fastapi import UploadFile
from sqlalchemy.orm import Session
from typing import List, Union

from crud import crud_image
from utils.file_handling import save_uploaded_file, _calculate_file_hash, delete_image_files
from processing.metadata_extraction import extract_exif_data
from database.models import Image
from api.schemas import ImageResponse

logger = logging.getLogger(__name__)

def process_new_uploads(db: Session, files: List[UploadFile]) -> List[Union[Image, ImageResponse]]:
    """Orchestrates the entire image upload process."""
    results = []
    for file in files:
        try:
            image_hash = _calculate_file_hash(file)
            existing_image = crud_image.get_by_hash(db, image_hash=image_hash)

            if existing_image:
                logger.info(f"Duplicate found for '{file.filename}'. Matches ID: {existing_image.id}")
                results.append(ImageResponse(
                    id=existing_image.id, filename=existing_image.filename,
                    original_filename=file.filename, file_path=existing_image.file_path,
                    has_thumbnail=existing_image.has_thumbnail, is_duplicate=True,
                    message=f"Duplicate of existing image ID: {existing_image.id}"
                ))
                continue

            image_path, unique_filename = save_uploaded_file(file)
            metadata = extract_exif_data(str(image_path))
            image_data = {
                "filename": unique_filename, "original_filename": file.filename,
                "file_path": str(image_path), "file_size": image_path.stat().st_size,
                "mime_type": file.content_type, "image_hash": image_hash, **metadata
            }
            new_image = crud_image.create(db, image_data=image_data)
            logger.info(f"Saved new file: {file.filename} as {unique_filename}")
            results.append(new_image)
        except Exception as e:
            logger.error(f"Could not process file '{file.filename}'. Error: {e}. Skipping.")
    return results

def delete_image_and_files(db: Session, image_id: int) -> Image:
    """Orchestrates the deletion of an image from the DB and disk."""
    image = crud_image.get(db, image_id=image_id)
    if not image:
        raise ValueError("Image not found")
    if not delete_image_files(image):
        raise IOError("Failed to delete image files from disk.")
    crud_image.remove(db, image=image)
    return image