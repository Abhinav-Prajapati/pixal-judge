from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np
from typing import List

from database.database import get_db
from database.models import Image, ImageBatch
from processing.clustering import ImageClusterer
from .schemas import BatchCreate, BatchAnalyze, BatchUpdateImages, BatchResponse

router = APIRouter(
    prefix="/batches",
    tags=["Clustering Batches"]
)

@router.post("/", response_model=BatchResponse)
def create_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new, unprocessed batch record with a list of image IDs."""
    # Check if all provided image IDs exist
    images_exist_count = db.query(Image).filter(Image.id.in_(batch_data.image_ids)).count()
    if images_exist_count != len(batch_data.image_ids):
        raise HTTPException(status_code=404, detail="One or more image IDs not found.")

    new_batch = ImageBatch(
        batch_name=batch_data.name,
        image_ids=batch_data.image_ids,
        status='pending'  # Initial status
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return new_batch

@router.get("/", response_model=List[BatchResponse])
def get_all_batches(db: Session = Depends(get_db)):
    """Retrieves a list of all clustering batches."""
    return db.query(ImageBatch).all()

@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch_details(batch_id: int, db: Session = Depends(get_db)):
    """Gets all information about a specific batch by its ID."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    return batch

@router.post("/{batch_id}/images", response_model=BatchResponse)
def add_images_to_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Adds one or more images to an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    # Add new, unique image IDs to the batch
    current_ids = set(batch.image_ids)
    new_ids = set(image_data.image_ids)
    updated_ids = list(current_ids.union(new_ids))
    
    batch.image_ids = updated_ids
    db.commit()
    db.refresh(batch)
    return batch

@router.delete("/{batch_id}/images", response_model=BatchResponse)
def remove_images_from_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Removes one or more images from an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    # Remove specified IDs from the batch
    ids_to_remove = set(image_data.image_ids)
    updated_ids = [id for id in batch.image_ids if id not in ids_to_remove]

    batch.image_ids = updated_ids
    db.commit()
    db.refresh(batch)
    return batch

@router.put("/{batch_id}/analyze", response_model=BatchResponse)
def analyze_batch(batch_id: int, analysis_params: BatchAnalyze, db: Session = Depends(get_db)):
    """Runs (or re-runs) the clustering analysis on a batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    # Fetch images and validate that they have embeddings
    images_to_cluster = db.query(Image).filter(Image.id.in_(batch.image_ids)).all()
    if any(img.features is None for img in images_to_cluster):
        raise HTTPException(status_code=400, detail="One or more images in the batch are missing embeddings.")

    # Update status and parameters
    batch.status = 'processing'
    batch.parameters = {
        "eps": analysis_params.eps, 
        "min_samples": analysis_params.min_samples, 
        "metric": analysis_params.metric
    }
    db.commit()

    # Run clustering
    features_matrix = np.array([img.features for img in images_to_cluster])
    clusterer = ImageClusterer(eps=analysis_params.eps, min_samples=analysis_params.min_samples, metric=analysis_params.metric)
    labels = clusterer.fit_predict(features_matrix)

    # Create summary and update batch
    stats = clusterer.get_cluster_stats()
    cluster_map = {str(label): [] for label in set(labels)}
    for image, label in zip(images_to_cluster, labels):
        cluster_map[str(label)].append(image.id)

    summary_json = {
        "batch_id": batch.id,
        "total_images": stats['n_samples'],
        "clusters_found": stats['n_clusters'],
        "noise_points": stats['n_noise'],
        "cluster_map": cluster_map
    }
    
    batch.cluster_summary = summary_json
    batch.status = 'complete'
    db.commit()
    db.refresh(batch)
    
    return batch