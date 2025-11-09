import logging
import shutil
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from src.images.router import router as images_router
from src.batches.router import router as batches_router
from src.images import crud as images_crud
from utils.file_handling import setup_directories
from database import get_db
from tasks import generate_thumbnail_task, generate_embedding_task
from config import IMAGE_DIR, THUMB_DIR, DB_SCHEMA

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Image Clustering API",
    description="An API for uploading, processing, and clustering images.",
    version="1.0.0"
)


def process_missing_assets(db: Session):
    """Queue Celery tasks for missing thumbnails and embeddings."""
    logger.info("Startup: Checking for missing thumbnails and embeddings...")
    
    images_without_thumbnails = images_crud.get_without_thumbnails(db)
    images_without_embeddings = images_crud.get_without_embeddings(db)
    
    for image in images_without_thumbnails:
        generate_thumbnail_task.delay(image.id)
        
    for image in images_without_embeddings:
        generate_embedding_task.delay(image.id)
            
    logger.info(f"Startup: Queued {len(images_without_thumbnails)} thumbnail tasks, {len(images_without_embeddings)} embedding tasks")


@app.on_event("startup")
async def startup_event():
    """Runs when the application starts."""
    logger.info("Running startup tasks...")
    setup_directories()
    logger.info("Asset directories are set up.")
    
    db: Session = next(get_db())
    try:
        process_missing_assets(db)
    finally:
        db.close()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(images_router)
app.include_router(batches_router)

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to the Image Clustering API!"}


@app.delete("/admin/truncate-all", tags=["Admin"])
def truncate_all_data(db: Session = Depends(get_db)):
    """
    DANGER: Truncate all data from database tables and delete all uploaded files.
    Keeps table structure intact. USE WITH CAUTION!
    """
    try:
        logger.warning("Truncating all database tables and deleting all files...")
        
        # Truncate tables in correct order (child tables first to avoid FK constraints)
        db.execute(text(f"TRUNCATE TABLE {DB_SCHEMA}.image_batch_association CASCADE"))
        db.execute(text(f"TRUNCATE TABLE {DB_SCHEMA}.image_batches CASCADE"))
        db.execute(text(f"TRUNCATE TABLE {DB_SCHEMA}.images CASCADE"))
        db.commit()
        
        # Delete all image files
        deleted_images = 0
        deleted_thumbnails = 0
        
        if IMAGE_DIR.exists():
            for file in IMAGE_DIR.glob("*"):
                if file.is_file():
                    file.unlink()
                    deleted_images += 1
        
        if THUMB_DIR.exists():
            for file in THUMB_DIR.glob("*"):
                if file.is_file():
                    file.unlink()
                    deleted_thumbnails += 1
        
        logger.warning(f"Truncated all tables. Deleted {deleted_images} images and {deleted_thumbnails} thumbnails.")
        
        return {
            "message": "All data truncated successfully",
            "tables_truncated": ["images", "image_batches", "image_batch_association"],
            "files_deleted": {
                "images": deleted_images,
                "thumbnails": deleted_thumbnails
            }
        }
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error truncating data: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to truncate data: {str(e)}")
