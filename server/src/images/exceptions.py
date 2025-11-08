"""
Domain-specific exceptions for Images module.
"""
from fastapi import HTTPException, status


class ImageNotFound(HTTPException):
    """Raised when an image is not found in the database."""
    def __init__(self, image_id: int = None):
        detail = f"Image {image_id} not found" if image_id else "Image not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ImageFileNotFound(HTTPException):
    """Raised when the image file doesn't exist on disk."""
    def __init__(self, message: str = "Image file not found on disk"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=message)


class ThumbnailNotFound(HTTPException):
    """Raised when a thumbnail doesn't exist for an image."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thumbnail does not exist for this image."
        )


class DuplicateImageError(HTTPException):
    """Raised when attempting to upload a duplicate image."""
    def __init__(self, existing_id: int):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate of existing image ID: {existing_id}"
        )


class InvalidImageFormat(HTTPException):
    """Raised when an invalid image format is uploaded."""
    def __init__(self, format: str = None):
        detail = f"Invalid image format: {format}" if format else "Invalid image format"
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class ImageProcessingError(Exception):
    """Raised when image processing fails."""
    def __init__(self, message: str = "Image processing failed"):
        self.message = message
        super().__init__(self.message)


class QualityAnalysisError(Exception):
    """Raised when quality analysis fails."""
    def __init__(self, message: str = "Quality analysis failed"):
        self.message = message
        super().__init__(self.message)
