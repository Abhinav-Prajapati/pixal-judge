# File: config.py
"""
Stores configuration variables for the application.
Centralizes settings for easy modification.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from a .env file
load_dotenv()

# Database connection URL for PostgreSQL.
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL")

# The custom schema name in the PostgreSQL database.
DB_SCHEMA = "image_clustering"

# --- Path Configuration ---
# Define the project's root directory to create robust, absolute paths.
PROJECT_ROOT = Path(__file__).parent.resolve()

# Define asset directories based on the project root.
IMAGE_DIR = PROJECT_ROOT / "assets" / "images"
THUMB_DIR = PROJECT_ROOT / "assets" / "thumbnails"

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