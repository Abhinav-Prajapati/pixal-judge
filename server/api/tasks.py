"""
Defines background tasks that run independently of the API request-response cycle.
Each function handles a specific, long-running process for an image.
"""
import logging
import torch
from sqlalchemy.orm import Session

from database.database import get_db
from crud import crud_image
from utils.file_handling import create_thumbnail
from processing.feature_extraction import ImageFeatureExtractor
from processing.metadata_extraction import extract_exif_data

logger = logging.getLogger(__name__)

def extract_metadata_task(image_id: int):
    """
    Background task to extract EXIF metadata from an image file and save it to the DB.
    """
    logger.info(f"Metadata task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud_image.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found in metadata task.")
            return

        # Only run if metadata seems missing (width is a good proxy)
        if image.width is None:
            metadata = extract_exif_data(image.file_path)
            if metadata:
                for key, value in metadata.items():
                    setattr(image, key, value)
                db.commit()
                logger.info(f"Successfully extracted and saved metadata for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error extracting metadata for image_id {image_id}: {e}")
        db.rollback()
    finally:
        db.close()

def generate_thumbnail_task(image_id: int):
    """
    Background task to create a thumbnail for a given image.
    """
    logger.info(f"Thumbnail task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud_image.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found in thumbnail task.")
            return

        if not image.has_thumbnail:
            create_thumbnail(image)
            db.commit() # The create_thumbnail function sets the flag, we just need to commit it.
            logger.info(f"Successfully created thumbnail for image_id: {image_id}")

    except Exception as e:
        logger.error(f"Error creating thumbnail for image_id {image_id}: {e}")
        db.rollback()
    finally:
        db.close()

def generate_embedding_task(image_id: int):
    """
    Background task to generate feature embeddings for a given image.
    """
    logger.info(f"Embedding task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud_image.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found in embedding task.")
            return

        if image.features is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            extractor = ImageFeatureExtractor(device=device)
            features = extractor.extract_features(image.file_path)
            if features is not None:
                image.features = features
                db.commit()
                logger.info(f"Successfully generated embedding for image_id: {image_id}")

    except Exception as e:
        logger.error(f"Error generating embedding for image_id {image_id}: {e}")
        db.rollback()
    finally:
        db.close()
