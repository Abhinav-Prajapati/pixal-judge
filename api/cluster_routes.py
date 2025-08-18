"""
API endpoints for clustering operations.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import numpy as np

from database.database import get_db
from database.models import Image, ImageBatch
from processing.clustering import ImageClusterer
from .schemas import BatchCreate, BatchResponse

router = APIRouter(
    prefix="/clusters",
    tags=["Clustering"]
)

@router.post("/create_batch", response_model=BatchResponse)
def create_clustering_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new clustering batch from a list of image IDs."""
    
    # 1. Fetch images and validate
    images_to_cluster = db.query(Image).filter(Image.id.in_(batch_data.image_ids)).all()
    if len(images_to_cluster) != len(batch_data.image_ids):
        raise HTTPException(status_code=404, detail="One or more image IDs not found.")
    
    if any(img.features is None for img in images_to_cluster):
        raise HTTPException(status_code=400, detail="One or more images are missing embeddings.")

    # 2. Create and save the initial batch record
    batch_params = {
        "eps": batch_data.eps, "min_samples": batch_data.min_samples, "metric": batch_data.metric
    }
    new_batch = ImageBatch(
        batch_name=batch_data.name,
        image_ids=batch_data.image_ids,
        parameters=batch_params,
        status='processing'
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    # 3. Run clustering
    features_matrix = np.array([img.features for img in images_to_cluster])
    clusterer = ImageClusterer(eps=batch_data.eps, min_samples=batch_data.min_samples, metric=batch_data.metric)
    labels = clusterer.fit_predict(features_matrix)

    # 4. Create summary and update batch
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
    
    new_batch.cluster_summary = summary_json
    new_batch.status = 'complete'
    db.commit()
    db.refresh(new_batch)

    return new_batch