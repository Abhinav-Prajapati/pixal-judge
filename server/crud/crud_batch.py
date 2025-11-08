"""Backward compatibility layer for batch CRUD operations."""
from src.batches.crud import (
    get,
    get_multi,
    create,
    remove,
    update,
    get_associations_map
)

__all__ = ['get', 'get_multi', 'create', 'remove', 'update', 'get_associations_map']