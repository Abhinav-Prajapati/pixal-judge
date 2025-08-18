"""
Main command-line interface for the image clustering application.
Handles uploading, thumbnailing, feature extraction, and batch clustering via flags.
"""
import argparse
import uuid
from pathlib import Path
import torch
import numpy as np
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Image, ImageBatch
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

def handle_create_batch(db: Session, args: argparse.Namespace):
    """Handles the --create_batch action, running a clustering process on specified image IDs."""
    print(f"Creating new clustering batch named: '{args.name}'")
    
    # 1. Fetch the specified images
    image_ids = [int(id) for id in args.image_ids]
    images_to_cluster = db.query(Image).filter(Image.id.in_(image_ids)).all()

    # Validate that all requested images were found and have features
    found_ids = {img.id for img in images_to_cluster}
    missing_ids = set(image_ids) - found_ids
    if missing_ids:
        print(f"Error: Could not find images with the following IDs: {missing_ids}")
        return

    images_missing_features = [img for img in images_to_cluster if img.features is None]
    if images_missing_features:
        missing_ids = {img.id for img in images_missing_features}
        print(f"Error: The following images are missing embeddings: {missing_ids}. Please run --create_embeddings first.")
        return

    # 2. Create and save the initial batch record
    batch_params = {"eps": args.eps, "min_samples": args.min_samples, "metric": args.metric}
    new_batch = ImageBatch(
        batch_name=args.name,
        image_ids=image_ids,
        parameters=batch_params,
        status='processing'
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    # 3. Prepare data and run clustering
    features_matrix = np.array([img.features for img in images_to_cluster])
    image_paths = [img.file_path for img in images_to_cluster]
    
    clusterer = ImageClusterer(eps=args.eps, min_samples=args.min_samples, metric=args.metric)
    labels = clusterer.fit_predict(features_matrix)

    # 4. Create the cluster summary JSON
    stats = clusterer.get_cluster_stats()
    cluster_map = {str(label): [] for label in set(labels)}
    for image, label in zip(images_to_cluster, labels):
        cluster_map[str(label)].append(image.id)

    summary_json = {
        "batch_id": new_batch.id,
        "total_images": stats['n_samples'],
        "clusters_found": stats['n_clusters'],
        "noise_points": stats['n_noise'],
        "cluster_map": cluster_map
    }

    # 5. Update the batch record with the results
    new_batch.cluster_summary = summary_json
    new_batch.status = 'complete'
    db.commit()

    # 6. Visualize and organize files
    visualize_and_organize(features_matrix, labels, image_paths, args.output_dir)
    print(f"\nBatch '{args.name}' created and clustering complete.")
    print(f"Results saved to {args.output_dir}/")

def main():
    """Main function to parse arguments and dispatch actions."""
    parser = argparse.ArgumentParser(description='CLI for Image Clustering Application')
    
    # Subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Upload command
    parser_upload = subparsers.add_parser('upload', help='Upload an image or a directory of images.')
    parser_upload.add_argument('path', type=str, help='Path to the image or directory.')

    # Thumbnails command
    subparsers.add_parser('create_thumbnails', help='Create thumbnails for all images missing them.')

    # Embeddings command
    subparsers.add_parser('create_embeddings', help='Create feature embeddings for all images missing them.')

    # Batch command
    parser_batch = subparsers.add_parser('create_batch', help='Run a new clustering process on a set of images.')
    parser_batch.add_argument('--name', type=str, required=True, help='A name for this clustering batch.')
    parser_batch.add_argument('--image_ids', type=int, nargs='+', required=True, help='A space-separated list of image IDs to cluster.')
    parser_batch.add_argument('--output_dir', type=str, default='clustering_results', help='Output directory for results.')
    parser_batch.add_argument('--eps', type=float, default=0.3, help='DBSCAN eps parameter.')
    parser_batch.add_argument('--min_samples', type=int, default=2, help='DBSCAN min_samples parameter.')
    parser_batch.add_argument('--metric', type=str, default='cosine', choices=['cosine', 'euclidean'], help='Distance metric.')
    
    args = parser.parse_args()

    # Setup
    setup_directories()
    db_session_gen = get_db()
    db = next(db_session_gen)

    try:
        if args.command == 'upload':
            handle_upload(db, args.path)
        elif args.command == 'create_thumbnails':
            handle_create_thumbnails(db)
        elif args.command == 'create_embeddings':
            handle_create_embeddings(db)
        elif args.command == 'create_batch':
            handle_create_batch(db, args)
        else:
            parser.print_help()
    finally:
        db.close()

if __name__ == "__main__":
    main()