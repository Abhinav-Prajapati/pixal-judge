"""
Handles the visualization of clustering results and file organization.
Creates a t-SNE plot and copies images into cluster-specific folders.
"""
import os
import shutil
import numpy as np
import matplotlib.pyplot as plt
from sklearn.manifold import TSNE
from typing import List, Dict

def visualize_and_organize(features: np.ndarray, labels: np.ndarray, image_paths: List[str], output_dir: str):
    """Visualizes clusters with t-SNE and organizes images into folders."""
    os.makedirs(output_dir, exist_ok=True)
    _organize_files(labels, image_paths, output_dir)
    _plot_tsne(features, labels, output_dir)
    _create_summary_file(labels, output_dir)

def _organize_files(labels: np.ndarray, image_paths: List[str], output_dir: str):
    """Copies image files into folders corresponding to their cluster label."""
    print("Organizing images into cluster folders...")
    unique_labels = set(labels)
    for label in unique_labels:
        folder_name = "noise" if label == -1 else f"cluster_{label}"
        folder_path = os.path.join(output_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)

    for image_path, label in zip(image_paths, labels):
        folder_name = "noise" if label == -1 else f"cluster_{label}"
        destination = os.path.join(output_dir, folder_name, os.path.basename(image_path))
        try:
            shutil.copy2(image_path, destination)
        except Exception as e:
            print(f"Error copying {image_path}: {e}")

def _plot_tsne(features: np.ndarray, labels: np.ndarray, output_dir: str):
    """Reduces feature dimensionality with t-SNE and creates a scatter plot."""
    print("Computing t-SNE for visualization...")
    # FIX: Changed 'n_iter' to 'max_iter' for compatibility with newer scikit-learn versions.
    tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(features) - 1), max_iter=1000)
    features_2d = tsne.fit_transform(features)

    plt.figure(figsize=(12, 8))
    unique_labels = set(labels)
    colors = plt.cm.Set1(np.linspace(0, 1, len(unique_labels)))

    for k, col in zip(unique_labels, colors):
        label_text = 'Noise' if k == -1 else f'Cluster {k}'
        marker = 'x' if k == -1 else 'o'
        class_mask = (labels == k)
        xy = features_2d[class_mask]
        plt.scatter(xy[:, 0], xy[:, 1], c=[col], marker=marker, s=50, label=label_text, alpha=0.7)

    plt.title('Image Clustering Results (t-SNE Visualization)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig(os.path.join(output_dir, 'clustering_visualization.png'), dpi=300)
    # plt.show() # Commented out to prevent blocking in non-interactive environments

def _create_summary_file(labels: np.ndarray, output_dir: str):
    """Writes a summary of the clustering results to a text file."""
    total_images = len(labels)
    n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
    n_noise = list(labels).count(-1)

    with open(os.path.join(output_dir, 'clustering_summary.txt'), 'w') as f:
        f.write("Image Clustering Summary\n" + "=" * 50 + "\n\n")
        f.write(f"Total images processed: {total_images}\n")
        f.write(f"Number of clusters found: {n_clusters}\n")
        f.write(f"Number of noise points: {n_noise}\n\n")
        f.write("Cluster Details:\n" + "-" * 20 + "\n")
        for label in sorted(set(labels)):
            folder_name = "noise" if label == -1 else f"cluster_{label}"
            count = list(labels).count(label)
            percentage = (count / total_images) * 100
            f.write(f"{folder_name}: {count} images ({percentage:.1f}%)\n")
