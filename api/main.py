"""
Main FastAPI application file.
Initializes the app, includes the API routers, and sets up logging.
"""
import logging
from fastapi import FastAPI
from . import image_routes, cluster_routes

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

# Include the routers from other modules
app.include_router(image_routes.router)
app.include_router(cluster_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Image Clustering API!"}