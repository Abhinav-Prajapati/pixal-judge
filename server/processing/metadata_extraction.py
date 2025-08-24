# File: processing/metadata_extraction.py

from PIL import Image
from PIL.ExifTags import TAGS
from datetime import datetime
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

def extract_exif_data(image_path: str) -> Dict[str, Any]:
    """Extracts relevant EXIF metadata from an image file."""
    metadata = {}
    try:
        img = Image.open(image_path)
        metadata['width'] = img.width
        metadata['height'] = img.height

        exif_data = img._getexif()
        if not exif_data:
            return metadata

        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == 'DateTimeOriginal' and isinstance(value, str):
                try:
                    metadata['shot_at'] = datetime.strptime(value, '%Y:%m:%d %H:%M:%S')
                except ValueError:
                    pass # Ignore malformed dates
            elif tag_name == 'Make' and isinstance(value, str):
                metadata['camera_make'] = value.strip()
            elif tag_name == 'Model' and isinstance(value, str):
                metadata['camera_model'] = value.strip()
            elif tag_name == 'FNumber':
                metadata['f_number'] = float(value)
            elif tag_name == 'ExposureTime':
                metadata['exposure_time'] = f"1/{int(1/float(value))}" if value > 0 else "0"
            elif tag_name == 'ISOSpeedRatings':
                metadata['iso'] = value
            elif tag_name == 'FocalLength':
                metadata['focal_length'] = f"{int(value)}mm"

    except Exception as e:
        logger.warning(f"Could not read metadata for {image_path}: {e}")
    
    return metadata