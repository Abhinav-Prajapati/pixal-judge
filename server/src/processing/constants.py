"""Constants for processing operations."""

# Feature extraction models
FEATURE_MODELS = ['RESNET50', 'DINOV3', 'CLIP']
DEFAULT_FEATURE_MODEL = 'CLIP'

# Quality metrics
QUALITY_METRICS = ['clipiqa+', 'brisque', 'niqe', 'musiq', 'cnniqa', 'liqe']
DEFAULT_QUALITY_METRIC = 'liqe'

# Clustering parameters
DEFAULT_MIN_CLUSTER_SIZE = 5
DEFAULT_MIN_SAMPLES = 5
DEFAULT_CLUSTERING_METRIC = 'cosine'

# EXIF tags to extract
EXIF_TAGS = [
    'DateTimeOriginal',
    'Make',
    'Model',
    'FNumber',
    'ExposureTime',
    'ISOSpeedRatings',
    'FocalLength'
]
