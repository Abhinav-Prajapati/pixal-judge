from fastapi import HTTPException

class NotFoundError(HTTPException):
    """Raised when a resource is not found."""
    def __init__(self, resource: str):
        super().__init__(status_code=404, detail=f"{resource} not found.")

class ValidationError(HTTPException):
    """Raised when validation fails."""
    def __init__(self, message: str):
        super().__init__(status_code=400, detail=message)

class ServiceError(Exception):
    """Base error for service layer operations."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
