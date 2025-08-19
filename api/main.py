"""
Main FastAPI application file.
Initializes the app, includes the API routers, and sets up logging.
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

app.include_router(image_routes.router)
app.include_router(cluster_routes.router)

@app.get("/", tags=["Root"])
def read_root():
    """A simple health check endpoint."""
    return {"message": "Welcome to the Image Clustering API!"}