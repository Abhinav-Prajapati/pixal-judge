import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

class ImageQualityAnalyzer:
    """Analyzes image quality using PyIQA metrics."""
    
    SUPPORTED_METRICS = {
        'clipiqa+': {'range': (0, 1), 'higher_is_better': True},
        'brisque': {'range': (0, 100), 'higher_is_better': False},
        'niqe': {'range': (0, 100), 'higher_is_better': False},
        'musiq': {'range': (0, 100), 'higher_is_better': True},
        'cnniqa': {'range': (0, 1), 'higher_is_better': True},
        'liqe': {'range': (0, 1), 'higher_is_better': True},
    }
    
    def __init__(self, metric: str = 'brisque'):
        """
        Initialize the quality analyzer with a specific metric.
        
        Args:
            metric: PyIQA metric name (clipiqa+, brisque, niqe, musiq, cnniqa, liqe)
        """
        if metric not in self.SUPPORTED_METRICS:
            raise ValueError(
                f"Unsupported metric: {metric}. "
                f"Supported metrics: {list(self.SUPPORTED_METRICS.keys())}"
            )
        
        self.metric_name = metric
        self.metric = None
        self._initialize_metric()
    
    def _initialize_metric(self):
        """Lazy initialization of PyIQA metric."""
        try:
            import torch
            import pyiqa
            
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info(f"Initializing {self.metric_name} on device: {device}")
            
            self.metric = pyiqa.create_metric(self.metric_name, device=device)
            logger.info(f"Successfully initialized {self.metric_name}")
            
        except ImportError as e:
            logger.error(f"Failed to import PyIQA or torch: {e}")
            raise ImportError(
                "PyIQA is required for quality assessment. "
                "Install with: pip install pyiqa torch"
            )
        except Exception as e:
            logger.error(f"Failed to initialize metric {self.metric_name}: {e}")
            raise
    
    def analyze(self, image_path: str | Path) -> float:
        """
        Calculate quality score for an image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Quality score as float
            
        Raises:
            FileNotFoundError: If image doesn't exist
            Exception: If analysis fails
        """
        image_path = Path(image_path)
        
        if not image_path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        try:
            logger.info(f"Analyzing {image_path.name} with {self.metric_name}")
            score = self.metric(str(image_path)).item()
            logger.info(f"Quality score for {image_path.name}: {score:.4f}")
            return float(score)
            
        except Exception as e:
            logger.error(f"Failed to analyze {image_path}: {e}")
            raise
    
    def get_metric_info(self) -> dict:
        """Get information about the current metric."""
        return {
            'name': self.metric_name,
            **self.SUPPORTED_METRICS[self.metric_name]
        }
    
    @classmethod
    def is_higher_better(cls, metric_name: str) -> bool:
        """Check if higher scores are better for a given metric."""
        return cls.SUPPORTED_METRICS.get(metric_name, {}).get('higher_is_better', True)
