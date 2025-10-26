import numpy as np
from sqlalchemy.orm import Session
from fastapi import UploadFile
from typing import List, Dict, Union

import os
from datetime import datetime
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D 
import umap

from crud import crud_batch, crud_image
from database.models import ImageBatch, Image
from processing.grouping import ImageGrouper
from api.schemas import BatchAnalyze, ImageResponse
from services import image_service

class BatchServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

def _save_cluster_plot(features: np.ndarray, labels: np.ndarray, batch_id: int, metric: str = 'cosine'):
    """
    TEST FUNCTION: Reduces features to 3D using UMAP and saves a 3D scatter plot.
    """
    try:
        save_dir = "cluster_plots"
        os.makedirs(save_dir, exist_ok=True)
        
        print(f"DEBUG: Reducing {features.shape[0]} features to 3D using UMAP...")
        reducer = umap.UMAP(
            n_components=3,
            n_neighbors=15,
            min_dist=0.1,  
            metric=metric, 
            random_state=42
        )
        data_3d = reducer.fit_transform(features)
        
        fig = plt.figure(figsize=(12, 10))
        ax = fig.add_subplot(111, projection='3d')

        noise_mask = (labels == -1)
        core_mask = ~noise_mask

        if core_mask.any():
            ax.scatter(
                data_3d[core_mask, 0], data_3d[core_mask, 1], data_3d[core_mask, 2],
                c=labels[core_mask], cmap='viridis', s=40, alpha=0.8
            )

        if noise_mask.any():
            ax.scatter(
                data_3d[noise_mask, 0], data_3d[noise_mask, 1], data_3d[noise_mask, 2],
                c='grey', s=10, alpha=0.2, label='Ungrouped (-1)'
            )

        ax.set_title(f'3D UMAP Cluster Plot for Batch {batch_id}')
        ax.set_xlabel('UMAP Component 1')
        ax.set_ylabel('UMAP Component 2')
        ax.set_zlabel('UMAP Component 3')
        if noise_mask.any():
            ax.legend()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"batch_{batch_id}_cluster_plot_{timestamp}.png"
        save_path = os.path.join(save_dir, filename)
        
        plt.savefig(save_path)
        plt.close(fig) 
        print(f"DEBUG: Saved 3D cluster plot to {save_path}")

    except ImportError:
        print("WARNING: `umap-learn` or `matplotlib` not installed. Skipping 3D plot.")
    except Exception as e:
        print(f"WARNING: Failed to generate or save 3D plot: {e}")

def get_batch_or_fail(db: Session, batch_id: int) -> ImageBatch:
    batch = crud_batch.get(db, batch_id=batch_id)
    if not batch:
        raise BatchServiceError("Batch not found.", 404)
    return batch

def create_new_batch(db: Session, name: str, image_ids: list[int]) -> ImageBatch:
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchServiceError("One or more image IDs not found.", 404)
    return crud_batch.create(db, name=name, images=images_to_add)

def rename_batch(db: Session, batch_id: int, new_name: str) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    batch.batch_name = new_name
    return crud_batch.update(db, db_obj=batch)

def add_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    images_to_add = crud_image.get_multi_by_ids(db, image_ids=image_ids)
    if len(images_to_add) != len(set(image_ids)):
        raise BatchServiceError("One or more image IDs not found.", 404)
    
    for img in images_to_add:
        if img not in batch.images:
            batch.images.append(img)
    
    return crud_batch.update(db, db_obj=batch)

def remove_images(db: Session, batch_id: int, image_ids: List[int]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    ids_to_remove = set(image_ids)
    batch.images = [img for img in batch.images if img.id not in ids_to_remove]
    return crud_batch.update(db, db_obj=batch)

def upload_and_add(db: Session, batch_id: int, files: List[UploadFile]) -> (ImageBatch, List[Union[Image, ImageResponse]]):
    batch = get_batch_or_fail(db, batch_id)
    upload_results = image_service.process_new_uploads(db, files)
    
    newly_added_images = [res for res in upload_results if isinstance(res, Image)]
    for img in newly_added_images:
        if img not in batch.images:
            batch.images.append(img)
            
    updated_batch = crud_batch.update(db, db_obj=batch)
    return updated_batch, upload_results

def update_manual_groups(db: Session, batch_id: int, group_map: Dict[str, List[int]]) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    batch_image_ids = {img.id for img in batch.images}
    incoming_image_ids = {img_id for id_list in group_map.values() for img_id in id_list}
    if batch_image_ids != incoming_image_ids:
        raise BatchServiceError("The provided group map must contain the exact same set of images as the batch.")

    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for group_label, image_ids in group_map.items():
        for image_id in image_ids:
            if image_id in association_map:
                association_map[image_id].group_label = group_label
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)

def analyze_batch(db: Session, batch_id: int, params: BatchAnalyze) -> ImageBatch:
    batch = get_batch_or_fail(db, batch_id)
    if not batch.images:
        raise BatchServiceError("Cannot analyze an empty batch.")
    if any(img.features is None for img in batch.images):
        raise BatchServiceError("One or more images are missing feature embeddings.")

    batch.status = 'processing'
    batch.parameters = params.dict()
    crud_batch.update(db, db_obj=batch)
    
    features_matrix = np.array([img.features for img in batch.images])
    
    # Use new HDBSCAN parameters
    grouper = ImageGrouper(
        min_cluster_size=params.min_cluster_size,
        min_samples=params.min_samples,
        metric=params.metric
    )
    labels = grouper.fit_predict(features_matrix)

    # This gives tkinter issue so only enable when testing locally
    #_save_cluster_plot(features_matrix, labels, batch.id, metric=params.metric)

    
    # Create a mapping from numeric labels to descriptive names
    unique_cluster_labels = sorted([label for label in np.unique(labels) if label != -1])
    label_map = {label: f"Group {i+1}" for i, label in enumerate(unique_cluster_labels)}
    label_map[-1] = "Ungrouped"  # Map noise points to "Ungrouped"

    association_map = crud_batch.get_associations_map(db, batch_id=batch.id)
    for image, label in zip(batch.images, labels):
        if image.id in association_map:
            association_map[image.id].group_label = label_map.get(label, "Ungrouped")
    
    batch.status = 'complete'
    return crud_batch.update(db, db_obj=batch)