# File: config.py
"""
Stores configuration variables for the application.
Centralizes settings for easy modification.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from a .env file
load_dotenv(".env.development")

# Database connection URL for PostgreSQL.
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

# The custom schema name in the PostgreSQL database.
DB_SCHEMA = "image_clustering"

# --- Path Configuration ---
# Allow configurable storage paths via environment variables
STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", str(Path(__file__).parent.resolve())))

# Define asset directories based on the storage root
IMAGE_DIR = STORAGE_ROOT / "assets" / "images"
THUMB_DIR = STORAGE_ROOT / "assets" / "thumbnails"

# Create directories if they don't exist
IMAGE_DIR.mkdir(parents=True, exist_ok=True)
THUMB_DIR.mkdir(parents=True, exist_ok=True)

SCALE = 150
ASPECT_16x9 = 16 / 9

THUMB_SIZES = {
    "landscape": {
        "width": SCALE,
        "height": int(SCALE * ASPECT_16x9),
    },
    "portrait": {
        "width": int(SCALE * ASPECT_16x9),
        "height": SCALE,
    },
}