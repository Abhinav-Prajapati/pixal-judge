from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
import numpy as np
from typing import List

from database.database import get_db
from database.models import Image, ImageBatch
from processing.clustering import ImageClusterer
from .schemas import BatchCreate, BatchAnalyze, BatchUpdateImages, BatchResponse, BatchClusterUpdate, BatchRename
from sqlalchemy.orm.attributes import flag_modified
from utils.file_handling import handle_uploaded_image
from api.tasks import process_image_in_background

router = APIRouter(
    prefix="/batches",
    tags=["Clustering Batches"]
)

def _hydrate_batch_response(batch: ImageBatch, db: Session) -> ImageBatch:
    """
    Helper function to fetch full Image objects and attach them to the batch.
    Pydantic will use this `images` attribute to populate the BatchResponse.
    """
    if not batch.image_ids:
        batch.images = []
        return batch
    
    images = db.query(Image).filter(Image.id.in_(batch.image_ids)).all()
    image_map = {img.id: img for img in images}
    batch.images = [image_map[id] for id in batch.image_ids if id in image_map]
    return batch

def _add_image_ids_to_batch(batch: ImageBatch, image_ids: List[int], db: Session):
    """Helper to add a list of image IDs to a batch, handling duplicates."""
    current_ids = set(batch.image_ids)
    new_ids = set(image_ids)
    
    if not new_ids.issubset(current_ids):
        updated_ids = list(current_ids.union(new_ids))
        batch.image_ids = updated_ids
        flag_modified(batch, "image_ids")
        db.commit()
        db.refresh(batch)

@router.post("/", response_model=BatchResponse)
def create_batch(batch_data: BatchCreate, db: Session = Depends(get_db)):
    """Creates a new, unprocessed batch record with a list of image IDs."""
    images_exist_count = db.query(Image).filter(Image.id.in_(batch_data.image_ids)).count()
    if images_exist_count != len(set(batch_data.image_ids)):
        raise HTTPException(status_code=404, detail="One or more image IDs not found or are duplicates.")

    new_batch = ImageBatch(
        batch_name=batch_data.name,
        image_ids=batch_data.image_ids,
        status='pending'
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)
    return _hydrate_batch_response(new_batch, db)

@router.get("/", response_model=List[BatchResponse])
def get_all_batches(db: Session = Depends(get_db)):
    """Retrieves a list of all clustering batches with full image details."""
    batches = db.query(ImageBatch).all()
    if not batches:
        return []
    
    all_image_ids = {img_id for batch in batches for img_id in batch.image_ids}
    if not all_image_ids:
        for batch in batches:
            batch.images = []
        return batches

    images = db.query(Image).filter(Image.id.in_(all_image_ids)).all()
    image_map = {img.id: img for img in images}
    
    for batch in batches:
        batch.images = [image_map[id] for id in batch.image_ids if id in image_map]
        
    return batches

@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch_details(batch_id: int, db: Session = Depends(get_db)):
    """Gets all information about a specific batch by its ID."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    return _hydrate_batch_response(batch, db)

@router.put("/{batch_id}", response_model=BatchResponse)
def rename_batch(batch_id: int, batch_data: BatchRename, db: Session = Depends(get_db)):
    """Renames an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
    
    batch.batch_name = batch_data.name
    db.commit()
    db.refresh(batch)
    
    return _hydrate_batch_response(batch, db)

@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    """Deletes an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")
        
    db.delete(batch)
    db.commit()
    
    return {"message": f"Batch ID {batch_id} deleted successfully."}

@router.post("/{batch_id}/images", response_model=BatchResponse)
def add_images_to_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Adds one or more images to an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    _add_image_ids_to_batch(batch, image_data.image_ids, db)

    return _hydrate_batch_response(batch, db)

@router.post("/{batch_id}/upload-and-add", response_model=BatchResponse)
def upload_and_add_to_batch(
    batch_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    files: List[UploadFile] = File(...)
):
    """
    Uploads one or more images and adds them to a specific batch.
    """
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    processed_image_ids = []
    for file in files:
        try:
            image_model = handle_uploaded_image(file, db)
            background_tasks.add_task(process_image_in_background, image_model.id)
            processed_image_ids.append(image_model.id)
        except Exception as e:
            continue

    if not processed_image_ids:
        raise HTTPException(status_code=400, detail="No images were processed successfully.")

    _add_image_ids_to_batch(batch, processed_image_ids, db)
    
    return _hydrate_batch_response(batch, db)

@router.delete("/{batch_id}/images", response_model=BatchResponse)
def remove_images_from_batch(batch_id: int, image_data: BatchUpdateImages, db: Session = Depends(get_db)):
    """Removes one or more images from an existing batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    ids_to_remove = set(image_data.image_ids)
    updated_ids = [id for id in batch.image_ids if id not in ids_to_remove]

    batch.image_ids = updated_ids
    flag_modified(batch, "image_ids")
    db.commit()
    db.refresh(batch)

    return _hydrate_batch_response(batch, db)

@router.put("/{batch_id}/analyze", response_model=BatchResponse)
def analyze_batch(batch_id: int, analysis_params: BatchAnalyze, db: Session = Depends(get_db)):
    """Runs (or re-runs) the clustering analysis on a batch."""
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    images_to_cluster = db.query(Image).filter(Image.id.in_(batch.image_ids)).all()
    if any(img.features is None for img in images_to_cluster):
        raise HTTPException(status_code=400, detail="One or more images in the batch are missing embeddings.")
    
    image_map = {img.id: img for img in images_to_cluster}
    batch.images = [image_map[id] for id in batch.image_ids if id in image_map]

    batch.status = 'processing'
    batch.parameters = {
        "eps": analysis_params.eps, 
        "min_samples": analysis_params.min_samples, 
        "metric": analysis_params.metric
    }
    db.commit()

    features_matrix = np.array([img.features for img in images_to_cluster])
    clusterer = ImageClusterer(eps=analysis_params.eps, min_samples=analysis_params.min_samples, metric=analysis_params.metric)
    labels = clusterer.fit_predict(features_matrix)

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
    
    batch.images = [image_map[id] for id in batch.image_ids if id in image_map]
    
    return batch

@router.put("/{batch_id}/clusters", response_model=BatchResponse)
def update_clusters(
    batch_id: int,
    cluster_data: BatchClusterUpdate,
    db: Session = Depends(get_db)
):
    """
    Manually updates the cluster assignments for a batch.
    Validates that the new cluster map contains the exact same set of images
    as the batch itself.
    """
    batch = db.query(ImageBatch).filter(ImageBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found.")

    batch_image_ids = set(batch.image_ids)
    incoming_image_ids = set()
    for image_list in cluster_data.cluster_map.values():
        if len(image_list) != len(set(image_list)):
            raise HTTPException(status_code=400, detail="Duplicate image IDs found within a single cluster.")
        incoming_image_ids.update(image_list)

    if batch_image_ids != incoming_image_ids:
        raise HTTPException(
            status_code=400,
            detail="The provided cluster map must contain exactly the same set of images as the batch."
        )

    if batch.cluster_summary is None:
        batch.cluster_summary = {}

    batch.cluster_summary['cluster_map'] = cluster_data.cluster_map
    batch.cluster_summary['total_images'] = len(batch_image_ids)
    batch.cluster_summary['clusters_found'] = len(cluster_data.cluster_map)
    batch.cluster_summary['noise_points'] = len(cluster_data.cluster_map.get('-1', []))
    batch.cluster_summary['note'] = "Manually updated"

    flag_modified(batch, "cluster_summary")

    batch.status = 'complete'
    
    db.commit()
    db.refresh(batch)
    
    return _hydrate_batch_response(batch, db)