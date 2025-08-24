import logging
import threading
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import image_routes, cluster_routes
from utils.file_handling import setup_directories
from database.database import get_db
from services.startup_service import process_missing_thumbnails, process_missing_embeddings

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
    """
    This function runs when the application starts.
    1. It ensures that the necessary asset directories exist.
    2. It starts separate background threads for each startup processing task.
    """
    logging.info("Running startup tasks...")
    setup_directories()
    logging.info("Asset directories are set up.")
    
    thumbnail_thread = threading.Thread(target=run_thumbnail_processing)
    thumbnail_thread.start()
    
    embedding_thread = threading.Thread(target=run_embedding_processing)
    embedding_thread.start()

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

app.include_router(image_routes.router)
app.include_router(cluster_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Image Clustering API!"}