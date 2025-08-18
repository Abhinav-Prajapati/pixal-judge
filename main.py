# File: main.py
"""
Main command-line interface for the image clustering application.
Handles uploading, thumbnailing, feature extraction, and clustering via flags.
"""
import argparse
import uuid
from pathlib import Path
import torch
import numpy as np
from sqlalchemy.orm import Session, joinedload

from database.database import init_db, get_db
from database.models import Image, ClusteringResult
from processing.feature_extraction import ImageFeatureExtractor
from processing.clustering import ImageClusterer
from utils.visualization import visualize_and_organize
from utils.file_handling import setup_directories, save_image_from_path, create_thumbnail

def handle_upload(db: Session, image_path: str):
    """Handles the --upload action."""
    source_path = Path(image_path)
    if not source_path.exists():
        print(f"Error: Source image path does not exist: {image_path}")
        return
    
    if source_path.is_dir():
        for item in source_path.iterdir():
            if item.is_file():
                save_image_from_path(item, db)
    else:
        save_image_from_path(source_path, db)

def handle_create_thumbnails(db: Session):
    """Handles the --create_thumbnails action."""
    images_without_thumbnails = db.query(Image).filter_by(has_thumbnail=False).all()
    if not images_without_thumbnails:
        print("All images already have thumbnails.")
        return
    
    print(f"Creating thumbnails for {len(images_without_thumbnails)} images...")
    for image in images_without_thumbnails:
        create_thumbnail(image)
    db.commit()
    print("Thumbnail creation complete.")

def handle_create_embeddings(db: Session):
    """Handles the --create_embeddings action."""
    images_without_features = db.query(Image).filter(Image._features == None).all()
    if not images_without_features:
        print("All images already have feature embeddings.")
        return
        
    print(f"Creating embeddings for {len(images_without_features)} images...")
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    extractor = ImageFeatureExtractor(device=device)
    
    for image in images_without_features:
        features = extractor.extract_features(image.file_path)
        if features is not None:
            image.features = features
    
    db.commit()
    print("Embedding creation complete.")

def handle_cluster(db: Session, args: argparse.Namespace):
    """Handles the --cluster action."""
    print("Starting clustering process...")
    images_with_features = db.query(Image).filter(Image._features != None).options(joinedload(Image.results)).all()
    
    if not images_with_features:
        print("No images with features found to cluster. Please run --create_embeddings first.")
        return
        
    features_matrix = np.array([img.features for img in images_with_features])
    image_paths = [img.file_path for img in images_with_features]
    image_id_map = {img.id: img for img in images_with_features}

    clusterer = ImageClusterer(eps=args.eps, min_samples=args.min_samples, metric=args.metric)
    labels = clusterer.fit_predict(features_matrix)
    
    run_id = str(uuid.uuid4())
    print(f"Saving results for run_id: {run_id}")
    for image, label in zip(images_with_features, labels):
        result = ClusteringResult(
            run_id=run_id,
            image_id=image.id,
            cluster_label=int(label)
        )
        db.add(result)
    db.commit()
    
    visualize_and_organize(features_matrix, labels, image_paths, args.output_dir)
    print(f"\nClustering complete. Results saved to {args.output_dir}/")

def main():
    """Main function to parse arguments and dispatch actions."""
    parser = argparse.ArgumentParser(description='CLI for Image Clustering Application')
    parser.add_argument('--upload', type=str, help='Path to an image or a directory of images to upload.')
    parser.add_argument('--create_thumbnails', action='store_true', help='Create thumbnails for all images missing them.')
    parser.add_argument('--create_embeddings', action='store_true', help='Create feature embeddings for all images missing them.')
    parser.add_argument('--cluster', action='store_true', help='Run the clustering process on all images with embeddings.')
    
    # Clustering specific arguments
    parser.add_argument('--output_dir', type=str, default='clustering_results', help='Output directory for clustering results.')
    parser.add_argument('--eps', type=float, default=0.3, help='DBSCAN eps parameter.')
    parser.add_argument('--min_samples', type=int, default=2, help='DBSCAN min_samples parameter.')
    parser.add_argument('--metric', type=str, default='cosine', choices=['cosine', 'euclidean'], help='Distance metric for clustering.')
    
    args = parser.parse_args()

    # Setup
    init_db()
    setup_directories()
    db_session_gen = get_db()
    db = next(db_session_gen)

    try:
        if args.upload:
            handle_upload(db, args.upload)
        if args.create_thumbnails:
            handle_create_thumbnails(db)
        if args.create_embeddings:
            handle_create_embeddings(db)
        if args.cluster:
            handle_cluster(db, args)
        
        # If no action is specified, show help
        if not any([args.upload, args.create_thumbnails, args.create_embeddings, args.cluster]):
            parser.print_help()
    finally:
        db.close()

if __name__ == "__main__":
    main()
