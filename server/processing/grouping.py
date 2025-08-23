"""
Contains the logic for clustering image features using DBSCAN.
This module is responsible for the core clustering algorithm.
"""
import numpy as np
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from typing import Dict

class ImageGrouper:
    """Clusters image features using the DBSCAN algorithm."""

    def __init__(self, eps: float = 0.5, min_samples: int = 2, metric: str = 'cosine'):
        """Initializes the DBSCAN model with specified parameters."""
        self.dbscan = DBSCAN(eps=eps, min_samples=min_samples, metric=metric)
        self.scaler = StandardScaler()
        self.labels_ = None

    def fit_predict(self, features: np.ndarray) -> np.ndarray:
        """Fits the DBSCAN model to the features and returns cluster labels."""
        print(f"Clustering {features.shape[0]} images with DBSCAN...")
        features_scaled = self.scaler.fit_transform(features) if self.dbscan.metric == 'euclidean' else features
        self.labels_ = self.dbscan.fit_predict(features_scaled)
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
