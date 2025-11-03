"""
Contains the logic for extracting feature vectors from images.
Uses pre-trained models for feature extraction.
"""

import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from torchvision.models import resnet50, ResNet50_Weights
from typing import List, Tuple
from transformers import AutoImageProcessor, AutoModel, CLIPProcessor, CLIPModel

class RESNET50:
    """Extracts deep features from images using a pre-trained ResNet50 model."""

    def __init__(self, device: str = 'cpu'):
        """Initializes the model and the image transformation pipeline."""
        self.device = device
        self.model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        self.model = torch.nn.Sequential(*list(self.model.children())[:-1])
        self.model.eval()
        self.model.to(device)

        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def get_embedding(self, image_path: str) -> np.ndarray:
        """Extracts a feature vector from a single image file."""
        try:
            image = Image.open(image_path).convert('RGB')
            image_tensor = self.transform(image).unsqueeze(0).to(self.device)
            with torch.no_grad():
                features = self.model(image_tensor)
                return features.squeeze().cpu().numpy()
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None

class DINOV3:
    """
    Extracts deep features from images using a pre-trained DINOv3 model.
    NOTE: This class requires 'pip install transformers accelerate'
    """

    def __init__(self, device: str = 'cpu'):
        """
        Initializes the model and the image processor.
        The 'device' param is for footprint compatibility.
        We use 'device_map="auto"' which is preferred for transformers.
        """
        self.model_name = "facebook/dinov3-vits16-pretrain-lvd1689m"
        
        self.processor = AutoImageProcessor.from_pretrained(self.model_name)
        self.model = AutoModel.from_pretrained(
            self.model_name,
            dtype=torch.float16,
            device_map="auto",  
            attn_implementation="sdpa"
        )
        self.model.eval()
        
        self.device = self.model.device
        print(f"DINOv3 model loaded on device: {self.device}")

    def get_embedding(self, image_path: str) -> np.ndarray:
        """Extracts a feature vector from a single image file."""
        try:
            image = Image.open(image_path).convert('RGB')
            
            inputs = self.processor(images=image, return_tensors="pt").to(
                self.device, dtype=torch.float16
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                features = outputs.pooler_output
                
            return features.squeeze().cpu().float().numpy()
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None

class CLIP:
    """
    Extracts deep features from images using OpenAI's CLIP model.
    CLIP produces highly semantic embeddings that work well for clustering similar images.
    NOTE: This class requires 'pip install transformers'
    """

    def __init__(self, device: str = 'cpu'):
        """
        Initializes the CLIP model and processor.
        Uses the latest CLIP ViT-L/14 model for best quality embeddings.
        """
        self.model_name = "openai/clip-vit-large-patch14"
        
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.model = CLIPModel.from_pretrained(self.model_name)
        self.model.eval()
        self.model.to(device)
        
        self.device = device
        print(f"CLIP model loaded on device: {self.device}")

    def get_embedding(self, image_path: str) -> np.ndarray:
        """
        Extracts a feature vector from a single image file.
        Returns the image embeddings from CLIP's vision encoder.
        """
        try:
            image = Image.open(image_path).convert('RGB')
            
            # Process the image
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            
            # Extract image features
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # Normalize the features (CLIP embeddings are typically normalized)
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
                
            return image_features.squeeze().cpu().numpy()
        except Exception as e:
            print(f"Error processing {image_path}: {e}")
            return None
