"""Domain-specific exceptions for Batches."""
from fastapi import HTTPException, status


class BatchNotFound(HTTPException):
    """Raised when batch is not found."""
    def __init__(self, batch_id: int = None):
        detail = f"Batch {batch_id} not found" if batch_id else "Batch not found"
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class BatchValidationError(HTTPException):
    """Raised when batch validation fails."""
    def __init__(self, message: str):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=message)


class ClusteringError(HTTPException):
    """Raised when clustering operation fails."""
    def __init__(self, message: str = "Clustering failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=message)
