#!/usr/bin/env python3
"""
Image Clustering using DBSCAN based on similarity
Proof of Concept implementation using uv for package management
"""

import os
import shutil
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler
from sklearn.manifold import TSNE
from sklearn.metrics.pairwise import cosine_similarity
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from pathlib import Path
import seaborn as sns
from typing import List, Tuple, Dict
import argparse


class ImageFeatureExtractor:
    """Extract features from images using pre-trained ResNet50"""
    
    def __init__(self, device='cpu'):
        self.device = device
        # Load pre-trained ResNet50 without the final classification layer
        self.model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        self.model = torch.nn.Sequential(*list(self.model.children())[:-1])  # Remove FC layer
        self.model.eval()
        self.model.to(device)
        
        # Image preprocessing pipeline
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def extract_features(self, image_path: str) -> np.ndarray:
        """Extract features from a single image"""
        try:
            # Load and preprocess image
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Extract features
            with torch.no_grad():
                features = self.model(image_tensor)
                features = features.squeeze().cpu().numpy()
            
            return features
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None
    
    def extract_batch_features(self, image_paths: List[str]) -> Tuple[np.ndarray, List[str]]:
        """Extract features from a batch of images"""
        features_list = []
        valid_paths = []
        
        print(f"Processing {len(image_paths)} images...")
        for i, path in enumerate(image_paths):
            if i % 10 == 0:
                print(f"Progress: {i}/{len(image_paths)}")
            
            features = self.extract_features(path)
            if features is not None:
                features_list.append(features)
                valid_paths.append(path)
        
        return np.array(features_list), valid_paths


class ImageClusterer:
    """Cluster images using DBSCAN based on feature similarity"""
    
    def __init__(self, eps=0.5, min_samples=2, metric='cosine'):
        self.eps = eps
        self.min_samples = min_samples
        self.metric = metric
        self.scaler = StandardScaler()
        self.dbscan = None
        self.labels_ = None
        self.features_ = None
    
    def fit_predict(self, features: np.ndarray) -> np.ndarray:
        """Fit DBSCAN and predict clusters"""
        print(f"Clustering {features.shape[0]} images with DBSCAN...")
        print(f"Parameters: eps={self.eps}, min_samples={self.min_samples}, metric={self.metric}")
        
        # Normalize features
        if self.metric == 'euclidean':
            features_scaled = self.scaler.fit_transform(features)
        else:
            features_scaled = features
        
        # Apply DBSCAN
        self.dbscan = DBSCAN(eps=self.eps, min_samples=self.min_samples, metric=self.metric)
        self.labels_ = self.dbscan.fit_predict(features_scaled)
        self.features_ = features_scaled
        
        return self.labels_
    
    def get_cluster_stats(self) -> Dict:
        """Get clustering statistics"""
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


def visualize_clusters(features: np.ndarray, labels: np.ndarray, image_paths: List[str], 
                      output_dir: str = 'clustering_results'):
    """Visualize clustering results and organize images into cluster folders"""
    os.makedirs(output_dir, exist_ok=True)
    
    # Create cluster folders and copy images
    print("Organizing images into cluster folders...")
    cluster_folders = {}
    unique_labels = set(labels)
    
    for label in unique_labels:
        if label == -1:
            folder_name = "noise"
        else:
            folder_name = f"cluster_{label}"
        
        folder_path = os.path.join(output_dir, folder_name)
        os.makedirs(folder_path, exist_ok=True)
        cluster_folders[label] = folder_path
    
    # Copy images to their respective cluster folders
    for image_path, label in zip(image_paths, labels):
        try:
            # Get the original filename
            filename = os.path.basename(image_path)
            destination = os.path.join(cluster_folders[label], filename)
            
            # Copy the image to the cluster folder
            shutil.copy2(image_path, destination)
            
        except Exception as e:
            print(f"Error copying {image_path}: {e}")
    
    # Print cluster organization summary
    print("\nCluster organization:")
    for label in sorted(unique_labels):
        folder_name = "noise" if label == -1 else f"cluster_{label}"
        count = list(labels).count(label)
        print(f"  {folder_name}: {count} images")
    
    # Reduce dimensionality for visualization
    print("\nComputing t-SNE for visualization...")
    tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(features)-1))
    features_2d = tsne.fit_transform(features)
    
    # Plot clusters
    plt.figure(figsize=(12, 8))
    colors = plt.cm.Set1(np.linspace(0, 1, len(unique_labels)))
    
    for k, col in zip(unique_labels, colors):
        if k == -1:
            # Noise points
            col = 'black'
            marker = 'x'
            label = 'Noise'
        else:
            marker = 'o'
            label = f'Cluster {k}'
        
        class_member_mask = (labels == k)
        xy = features_2d[class_member_mask]
        plt.scatter(xy[:, 0], xy[:, 1], c=[col], marker=marker, s=50, label=label, alpha=0.7)
    
    plt.title('Image Clustering Results (t-SNE Visualization)')
    plt.xlabel('t-SNE Component 1')
    plt.ylabel('t-SNE Component 2')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'clustering_visualization.png'), dpi=300, bbox_inches='tight')
    plt.show()
    
    # Save cluster information
    with open(os.path.join(output_dir, 'cluster_assignments.txt'), 'w') as f:
        f.write("Image Path\tCluster\tCluster Folder\n")
        for path, label in zip(image_paths, labels):
            folder_name = "noise" if label == -1 else f"cluster_{label}"
            f.write(f"{path}\t{label}\t{folder_name}\n")
    
    # Create a summary file
    with open(os.path.join(output_dir, 'clustering_summary.txt'), 'w') as f:
        f.write("Image Clustering Summary\n")
        f.write("=" * 50 + "\n\n")
        
        total_images = len(labels)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_noise = list(labels).count(-1)
        
        f.write(f"Total images processed: {total_images}\n")
        f.write(f"Number of clusters found: {n_clusters}\n")
        f.write(f"Number of noise points: {n_noise}\n\n")
        
        f.write("Cluster Details:\n")
        f.write("-" * 20 + "\n")
        
        for label in sorted(unique_labels):
            folder_name = "noise" if label == -1 else f"cluster_{label}"
            count = list(labels).count(label)
            percentage = (count / total_images) * 100
            f.write(f"{folder_name}: {count} images ({percentage:.1f}%)\n")
        
        f.write(f"\nImages have been organized into folders within: {output_dir}/\n")
        f.write("Each cluster folder contains the images belonging to that cluster.\n")


def create_sample_images(sample_dir: str = 'sample_images', n_images: int = 20):
    """Create sample images for testing (colored squares with different patterns)"""
    os.makedirs(sample_dir, exist_ok=True)
    
    print(f"Creating {n_images} sample images in {sample_dir}/...")
    
    for i in range(n_images):
        # Create different types of images
        img = Image.new('RGB', (224, 224))
        pixels = []
        
        if i < n_images // 3:  # Red-ish images
            base_color = (200 + i*2, 50 + i*3, 50 + i*2)
        elif i < 2 * n_images // 3:  # Blue-ish images
            base_color = (50 + i*2, 50 + i*3, 200 + i*2)
        else:  # Green-ish images
            base_color = (50 + i*2, 200 + i*3, 50 + i*2)
        
        # Add some pattern variation
        for y in range(224):
            for x in range(224):
                if (x + y) % (10 + i % 5) == 0:
                    pixels.append((255, 255, 255))  # White stripes
                else:
                    pixels.append(base_color)
        
        img.putdata(pixels)
        img.save(os.path.join(sample_dir, f'sample_{i:03d}.jpg'))


def main():
    parser = argparse.ArgumentParser(description='Image Clustering with DBSCAN')
    parser.add_argument('--image_dir', type=str, default='sample_images',
                       help='Directory containing images to cluster')
    parser.add_argument('--eps', type=float, default=0.3,
                       help='DBSCAN eps parameter')
    parser.add_argument('--min_samples', type=int, default=2,
                       help='DBSCAN min_samples parameter')
    parser.add_argument('--metric', type=str, default='cosine',
                       choices=['cosine', 'euclidean'], help='Distance metric')
    parser.add_argument('--create_samples', action='store_true',
                       help='Create sample images for testing')
    parser.add_argument('--output_dir', type=str, default='clustering_results',
                       help='Output directory for results')
    
    args = parser.parse_args()
    
    # Create sample images if requested
    if args.create_samples:
        create_sample_images(args.image_dir)
    
    # Check if image directory exists
    if not os.path.exists(args.image_dir):
        print(f"Image directory {args.image_dir} not found. Use --create_samples to create sample images.")
        return
    
    # Get image paths
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'}
    image_paths = []
    
    for ext in image_extensions:
        image_paths.extend(Path(args.image_dir).glob(f'*{ext}'))
        image_paths.extend(Path(args.image_dir).glob(f'*{ext.upper()}'))
    
    image_paths = [str(p) for p in image_paths]
    
    if not image_paths:
        print(f"No images found in {args.image_dir}")
        return
    
    print(f"Found {len(image_paths)} images")
    
    # Extract features
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    
    extractor = ImageFeatureExtractor(device=device)
    features, valid_paths = extractor.extract_batch_features(image_paths)
    
    print(f"Successfully extracted features from {len(valid_paths)} images")
    print(f"Feature shape: {features.shape}")
    
    # Cluster images
    clusterer = ImageClusterer(eps=args.eps, min_samples=args.min_samples, metric=args.metric)
    labels = clusterer.fit_predict(features)
    
    # Print results
    stats = clusterer.get_cluster_stats()
    print("\nClustering Results:")
    print(f"Number of clusters: {stats['n_clusters']}")
    print(f"Number of noise points: {stats['n_noise']}")
    print(f"Cluster sizes: {stats['cluster_sizes']}")
    
    # Visualize results and organize images
    visualize_clusters(features, labels, valid_paths, args.output_dir)
    
    print(f"\nResults saved to {args.output_dir}/")
    print("Images have been copied to their respective cluster folders:")
    unique_labels = set(labels)
    for label in sorted(unique_labels):
        folder_name = "noise" if label == -1 else f"cluster_{label}"
        count = list(labels).count(label)
        print(f"  - {folder_name}/: {count} images")


if __name__ == "__main__":
    main()