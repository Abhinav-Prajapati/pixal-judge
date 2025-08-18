"""
Main entry point for the image clustering application.
Orchestrates feature extraction, clustering, and result visualization.
"""
import os
import argparse
import uuid
from pathlib import Path
import torch
import numpy as np
from sqlalchemy.orm import Session

from database.database import init_db, get_db
from database.models import Image, ClusteringResult
from processing.feature_extraction import ImageFeatureExtractor
from processing.clustering import ImageClusterer
from utils.visualization import visualize_and_organize

def get_image_paths(image_dir: str) -> list:
    """Scans a directory and returns a list of paths to valid image files."""
    extensions = {'.jpg', '.jpeg', '.png', '.bmp'}
    return [str(p) for p in Path(image_dir).rglob('*') if p.suffix.lower() in extensions]

def process_and_store_features(db: Session, extractor: ImageFeatureExtractor, image_paths: list):
    """Extracts features for new images and stores them in the database."""
    print("Processing image features...")
    existing_paths = {img.filepath for img in db.query(Image.filepath).all()}
    
    for i, path in enumerate(image_paths):
        if path in existing_paths:
            continue
        
        if i % 10 == 0:
            print(f"Progress: {i}/{len(image_paths)}")
        
        features = extractor.extract_features(path)
        if features is not None:
            new_image = Image(filepath=path)
            new_image.features = features
            db.add(new_image)
    
    db.commit()
    print("Feature processing complete.")

def main():
    """Main function to run the clustering pipeline."""
    parser = argparse.ArgumentParser(description='Image Clustering with DBSCAN and PostgreSQL')
    parser.add_argument('--image_dir', type=str, required=True, help='Directory of images')
    parser.add_argument('--output_dir', type=str, default='clustering_results', help='Output directory')
    parser.add_argument('--eps', type=float, default=0.3, help='DBSCAN eps parameter')
    parser.add_argument('--min_samples', type=int, default=2, help='DBSCAN min_samples')
    parser.add_argument('--metric', type=str, default='cosine', choices=['cosine', 'euclidean'])
    args = parser.parse_args()

    # Initialize database
    init_db()
    db_session_gen = get_db()
    db = next(db_session_gen)

    try:
        # 1. Get image paths
        image_paths = get_image_paths(args.image_dir)
        if not image_paths:
            print(f"No images found in {args.image_dir}")
            return
        print(f"Found {len(image_paths)} images.")

        # 2. Extract and store features
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        extractor = ImageFeatureExtractor(device=device)
        process_and_store_features(db, extractor, image_paths)

        # 3. Retrieve all data for clustering
        all_images = db.query(Image).filter(Image.filepath.in_(image_paths)).all()
        if not all_images:
            print("No valid features could be extracted or found in DB.")
            return
            
        features_matrix = np.array([img.features for img in all_images])
        valid_paths = [img.filepath for img in all_images]
        image_id_map = {img.filepath: img.id for img in all_images}

        # 4. Perform clustering
        clusterer = ImageClusterer(eps=args.eps, min_samples=args.min_samples, metric=args.metric)
        labels = clusterer.fit_predict(features_matrix)
        
        # 5. Store clustering results
        run_id = str(uuid.uuid4())
        print(f"Saving results for run_id: {run_id}")
        for path, label in zip(valid_paths, labels):
            result = ClusteringResult(
                run_id=run_id,
                image_id=image_id_map[path],
                cluster_label=int(label)
            )
            db.add(result)
        db.commit()

        # 6. Visualize and organize files
        visualize_and_organize(features_matrix, labels, valid_paths, args.output_dir)
        print(f"\nClustering complete. Results saved to {args.output_dir}/")

    finally:
        db.close()

if __name__ == "__main__":
    main()
