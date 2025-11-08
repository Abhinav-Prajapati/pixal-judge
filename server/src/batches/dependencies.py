"""FastAPI dependencies for Batch domain."""
from fastapi import Depends
from sqlalchemy.orm import Session
from database import get_db
from src.batches import crud
from src.batches.models import ImageBatch
from src.batches.exceptions import BatchNotFound


def get_batch_or_404(batch_id: int, db: Session = Depends(get_db)) -> ImageBatch:
    """Validate batch exists and return it."""
    batch = crud.get(db, batch_id=batch_id)
    if not batch:
        raise BatchNotFound(batch_id)
    return batch
