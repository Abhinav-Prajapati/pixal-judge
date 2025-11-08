"""Constants for Batch domain."""

BATCH_STATUS_PENDING = 'pending'
BATCH_STATUS_ANALYZING = 'analyzing'
BATCH_STATUS_COMPLETED = 'completed'
BATCH_STATUS_FAILED = 'failed'

VALID_BATCH_STATUSES = {
    BATCH_STATUS_PENDING,
    BATCH_STATUS_ANALYZING,
    BATCH_STATUS_COMPLETED,
    BATCH_STATUS_FAILED
}

DEFAULT_MIN_CLUSTER_SIZE = 5
DEFAULT_MIN_SAMPLES = 5
DEFAULT_METRIC = 'cosine'

VALID_CLUSTER_METRICS = {
    'cosine',
    'euclidean',
    'manhattan',
    'chebyshev',
    'minkowski'
}
