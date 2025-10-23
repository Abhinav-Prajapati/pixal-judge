"""
Contains the logic for clustering image features using HDBSCAN.
This module is responsible for the core clustering algorithm.
"""
import numpy as np
import hdbscan
from typing import Dict

class ImageGrouper:
    """Clusters image features using the HDBSCAN algorithm."""

    def __init__(self, min_cluster_size: int = 5, min_samples: int = 5, metric: str = 'cosine'):
        """Initializes the HDBSCAN model with specified parameters."""
        self.clusterer = hdbscan.HDBSCAN(
            min_cluster_size=min_cluster_size,
            min_samples=min_samples,
            metric=metric,
            allow_single_cluster=True,
            algorithm='generic'
        )
        self.labels_ = None

    def fit_predict(self, features: np.ndarray) -> np.ndarray:
        """Fits the HDBSCAN model to the features and returns cluster labels."""
        print(f"Clustering {features.shape[0]} images with HDBSCAN...")
        # HDBSCAN is generally less sensitive to scaling, especially with cosine metric.
        # Removed the StandardScaler for simplicity.
        features_64 = features.astype(np.float64)
        self.labels_ = self.clusterer.fit_predict(features_64)
        return self.labels_

    def get_cluster_stats(self) -> Dict:
        """Returns statistics about the clustering results."""
        if self.labels_ is None:
            return {}
        n_clusters = len(set(self.labels_)) - (1 if -1 in self.labels_ else 0)
        n_noise = list(self.labels_).count(-1)
        return {
            'n_clusters': n_clusters,
            'n_noise': n_noise,
            'n_samples': len(self.labels_),
            'cluster_sizes': {i: list(self.labels_).count(i) for i in set(self.labels_) if i != -1}
        }