import logging
import torch
from celery import Celery
from sqlalchemy.orm import Session

from database import get_db
from src.images import crud
from src.images.models import Image
from src.batches.models import ImageBatch, ImageBatchAssociation
from utils.file_handling import create_thumbnail
from src.processing.features import CLIP
from src.processing.metadata import extract_exif_data
from config import CELERY_BROKER_URL, CELERY_TASK_CONFIG

logger = logging.getLogger(__name__)

celery_app = Celery('tasks', broker=CELERY_BROKER_URL)
celery_app.conf.update(**CELERY_TASK_CONFIG)

@celery_app.task(bind=True, max_retries=3)
def extract_metadata_task(self, image_id: int):
    logger.info(f"Metadata task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found")
            return

        if image.width is None:
            metadata = extract_exif_data(image.file_path)
            if metadata:
                for key, value in metadata.items():
                    setattr(image, key, value)
                db.commit()
                logger.info(f"Metadata extracted for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error extracting metadata for image_id {image_id}: {e}")
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def generate_thumbnail_task(self, image_id: int):
    logger.info(f"Thumbnail task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found")
            return

        if not image.has_thumbnail:
            create_thumbnail(image)
            db.commit()
            logger.info(f"Thumbnail created for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error creating thumbnail for image_id {image_id}: {e}")
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()

@celery_app.task(bind=True, max_retries=3)
def generate_embedding_task(self, image_id: int):
    logger.info(f"Embedding task started for image_id: {image_id}")
    db: Session = next(get_db())
    try:
        image = crud.get(db, image_id=image_id)
        if not image:
            logger.error(f"Image with id {image_id} not found")
            return

        if image.features is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            extractor = CLIP(device=device)
            features = extractor.get_embedding(image.file_path)
            if features is not None:
                image.features = features
                db.commit()
                logger.info(f"Embedding generated for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error generating embedding for image_id {image_id}: {e}")
        db.rollback()
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()

