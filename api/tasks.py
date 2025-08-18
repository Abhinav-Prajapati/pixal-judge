"""
Defines background tasks that run independently of the API request-response cycle.
This is used for long-running processes like creating thumbnails and embeddings.
"""
import logging
import torch
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Image
from utils.file_handling import create_thumbnail
from processing.feature_extraction import ImageFeatureExtractor

logger = logging.getLogger(__name__)

def process_image_in_background(image_id: int):
    """
    A single background task to create a thumbnail and embedding for one image.
    This function creates its own database session.
    """
    logger.info(f"Background task started for image_id: {image_id}")
    db: Session = next(get_db())
    
    try:
        image = db.query(Image).filter(Image.id == image_id).first()
        if not image:
            logger.error(f"Image with id {image_id} not found in background task.")
            return

        # 1. Create Thumbnail
        if not image.has_thumbnail:
            create_thumbnail(image)
        
        # 2. Create Embedding
        if image.features is None:
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            extractor = ImageFeatureExtractor(device=device)
            features = extractor.extract_features(image.file_path)
            if features is not None:
                image.features = features
        
        db.commit()
        logger.info(f"Background processing complete for image_id: {image_id}")
    except Exception as e:
        logger.error(f"Error processing image_id {image_id} in background: {e}")
        db.rollback()
    finally:
        db.close()