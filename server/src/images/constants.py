"""
Constants for Images domain.
"""

# Allowed image file extensions
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'}

# Maximum file size (10 MB)
MAX_IMAGE_SIZE = 10 * 1024 * 1024

# Supported quality metrics
QUALITY_METRICS = [
    'clipiqa+',
    'brisque',
    'niqe',
    'musiq',
    'cnniqa',
    'liqe'
]

# Default quality metric
DEFAULT_QUALITY_METRIC = 'clipiqa+'

# Error codes
class ImageErrorCode:
    """Error codes for image-related operations."""
    IMAGE_NOT_FOUND = "IMAGE_001"
    DUPLICATE_IMAGE = "IMAGE_002"
    INVALID_FORMAT = "IMAGE_003"
    FILE_TOO_LARGE = "IMAGE_004"
    THUMBNAIL_MISSING = "IMAGE_005"
    PROCESSING_FAILED = "IMAGE_006"
    QUALITY_ANALYSIS_FAILED = "IMAGE_007"
