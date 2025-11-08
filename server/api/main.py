import logging
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from src.images.router import router as images_router
from src.batches.router import router as batches_router
from utils.file_handling import setup_directories
from database import get_db
from api.startup_service import process_missing_thumbnails, process_missing_embeddings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI(
    title="Image Clustering API",
    description="An API for uploading, processing, and clustering images.",
    version="1.0.0"
)

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