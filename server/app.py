import logging
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.images.router import router as images_router
from src.batches.router import router as batches_router
from src.images import crud as images_crud
from utils.file_handling import setup_directories
from database import get_db
from tasks import generate_thumbnail_task, generate_embedding_task

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


def process_missing_thumbnails(db: Session):
    """Finds all images without a thumbnail and queues a generation task for each."""
    logger.info("Startup service: Searching for images with missing thumbnails...")
    
    images_to_process = images_crud.get_without_thumbnails(db)
    
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

    images_to_process = images_crud.get_without_embeddings(db)

    if not images_to_process:
        logger.info("Startup service: All images have embeddings.")
        return

    for image in images_to_process:
        logger.info(f"Startup service: Queuing embedding task for image_id: {image.id}")
        generate_embedding_task(image.id)
            
    logger.info(f"Startup service: Queued {len(images_to_process)} embedding generation tasks.")


def run_thumbnail_processing():
    """Wrapper function to get a DB session and process missing thumbnails."""
    db: Session = next(get_db())
    try:
        process_missing_thumbnails(db)
    finally:
        db.close()

def run_embedding_processing():
    """Wrapper function to get a DB session and process missing embeddings."""
    db: Session = next(get_db())
    try:
        process_missing_embeddings(db)
    finally:
        db.close()

@app.on_event("startup")
async def startup_event():
    """Runs when the application starts. Sets up directories and processes missing assets."""
    logging.info("Running startup tasks...")
    setup_directories()
    logging.info("Asset directories are set up.")

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

# Include routers - domain-based architecture
app.include_router(images_router)
app.include_router(batches_router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Image Clustering API!"}