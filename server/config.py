"""
Stores configuration variables for the application.
Centralizes settings for easy modification.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(".env.development")

DATABASE_URL = os.getenv("DATABASE_URL")

RABBITMQ_USER = os.getenv("RABBITMQ_USER", "user")
RABBITMQ_PASSWORD = os.getenv("RABBITMQ_PASSWORD", "password")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:5672/"

CELERY_TASK_CONFIG = {
    "task_serializer": "json",
    "accept_content": ["json"],
    "result_serializer": "json",
    "timezone": "UTC",
    "enable_utc": True,
    "worker_prefetch_multiplier": 1,
    "worker_max_tasks_per_child": 50,
}

DB_SCHEMA = "image_clustering"

STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", str(Path(__file__).parent.resolve())))

IMAGE_DIR = STORAGE_ROOT / "assets" / "images"
THUMB_DIR = STORAGE_ROOT / "assets" / "thumbnails"

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