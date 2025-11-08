"""Startup service for processing missing thumbnails and embeddings."""
import logging
from sqlalchemy.orm import Session

from src.images import crud
from api.tasks import generate_thumbnail_task, generate_embedding_task

logger = logging.getLogger(__name__)


def process_missing_thumbnails(db: Session):
    """Finds all images without a thumbnail and queues a generation task for each."""
    logger.info("Startup service: Searching for images with missing thumbnails...")
    
    images_to_process = crud.get_without_thumbnails(db)
    
    if not images_to_process:
        logger.info("Startup service: All images have thumbnails.")
        return

    for image in images_to_process:
        logger.info(f"Startup service: Queuing thumbnail task for image_id: {image.id}")
        generate_thumbnail_task(image.id)
            
    logger.info(f"Startup service: Queued {len(images_to_process)} thumbnail generation tasks.")


def process_missing_embeddings(db: Session):
    """Finds all images without feature embeddings and queues a generation task for each."""
    logger.info("Startup service: Searching for images with missing embeddings...")

    images_to_process = crud.get_without_embeddings(db)

    if not images_to_process:
        logger.info("Startup service: All images have embeddings.")
        return

    for image in images_to_process:
        logger.info(f"Startup service: Queuing embedding task for image_id: {image.id}")
        generate_embedding_task(image.id)
            
    logger.info(f"Startup service: Queued {len(images_to_process)} embedding generation tasks.")

