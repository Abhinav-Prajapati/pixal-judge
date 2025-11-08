# PIXSORT - Backend Server

FastAPI backend for image processing and clustering with ML-powered feature extraction.

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Client
        UI[Web UI]
    end
    
    subgraph "FastAPI Server"
        API[API Layer<br/>app.py]
        
        subgraph Domains
            IMG[Images Domain<br/>Upload, Quality]
            BAT[Batches Domain<br/>Projects, Clustering]
            PROC[Processing Domain<br/>Features, Metadata]
        end
        
        BG[Background Tasks<br/>tasks.py]
    end
    
    subgraph Storage
        DB[(PostgreSQL<br/>SQLAlchemy)]
        FS[File System<br/>Images/Thumbnails]
    end
    
    subgraph Workers
        REDIS[(Redis)]
        CELERY[Celery Workers]
    end
    
    subgraph "ML Pipeline"
        FEAT[Feature Extraction<br/>RESNET/DINOV2/CLIP]
        QUAL[Quality Assessment<br/>PyIQA - 6 metrics]
        CLUST[Clustering<br/>HDBSCAN]
    end
    
    UI -->|HTTP Requests| API
    API --> IMG
    API --> BAT
    IMG --> PROC
    BAT --> PROC
    
    API -->|Queue Tasks| BG
    BG -->|Publish| REDIS
    REDIS -->|Consume| CELERY
    
    IMG -->|CRUD| DB
    BAT -->|CRUD| DB
    IMG -->|Store/Retrieve| FS
    
    CELERY -->|Generate| FEAT
    CELERY -->|Analyze| QUAL
    BAT -->|Cluster| CLUST
    
    FEAT -->|Save Embeddings| DB
    QUAL -->|Save Scores| DB
    CLUST -->|Update Labels| DB
    
    style API fill:#4CAF50
    style IMG fill:#2196F3
    style BAT fill:#FF9800
    style PROC fill:#9C27B0
    style DB fill:#F44336
    style REDIS fill:#E91E63
```

## 🚀 How It Works

### Image Upload Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant ImageService
    participant Database
    participant Celery
    participant ML

    Client->>API: POST /images/upload
    API->>ImageService: process_new_uploads()
    ImageService->>ImageService: Calculate SHA-256 hash
    ImageService->>Database: Check for duplicate
    alt Duplicate Found
        ImageService-->>API: Return existing image
    else New Image
        ImageService->>Database: Save metadata
        ImageService-->>API: Return new image
        API->>Celery: Queue thumbnail task
        API->>Celery: Queue embedding task
        Celery->>ML: Generate thumbnail
        Celery->>ML: Extract features (DINOV2)
        ML->>Database: Save embedding
    end
    API-->>Client: Response
```

### Clustering Analysis Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant BatchService
    participant Database
    participant HDBSCAN

    Client->>API: PUT /batches/{id}/analyze
    API->>BatchService: analyze_batch()
    BatchService->>Database: Fetch batch + images
    BatchService->>Database: Load all embeddings
    BatchService->>HDBSCAN: fit_predict(embeddings)
    HDBSCAN-->>BatchService: Cluster labels
    BatchService->>Database: Update group_label for each image
    BatchService->>Database: Set batch status = "complete"
    BatchService-->>API: Return clustered batch
    API-->>Client: Response with groups
```

## 📁 Project Structure

```
server/
├── src/                    # Domain-based architecture
│   ├── images/            # Image domain (9 files)
│   ├── batches/           # Batch/clustering domain (8 files)
│   └── processing/        # Shared ML utilities (5 files)
├── alembic/               # Database migrations
├── utils/                 # File handling, exceptions
├── app.py                 # FastAPI application
├── database.py            # SQLAlchemy setup
├── tasks.py               # Celery background tasks
├── config.py              # Configuration management
└── startup.py             # Production entry point
```

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **Database:** PostgreSQL + SQLAlchemy + Alembic
- **Task Queue:** Redis + Celery
- **ML Models:** PyTorch, RESNET50, DINOV2, CLIP
- **Clustering:** HDBSCAN
- **Quality:** PyIQA (BRISQUE, NIQE, PIQE, etc.)
- **Image Processing:** Pillow
- **Package Manager:** UV

## 🚦 Quick Start

```bash
# 1. Setup environment
cp example.env .env

# 2. Install dependencies
uv sync

# 3. Start database
docker-compose up -d db

# 4. Run migrations
alembic upgrade head

# 5. Start server (development)
python run_server.py

# 6. Start Celery worker (separate terminal)
celery -A tasks worker --loglevel=info
```

Server runs on: `http://localhost:8000`  
API Docs: `http://localhost:8000/docs`

## 📡 API Endpoints

### Images (`/images`)
- `POST /upload` - Upload images
- `GET /` - List all images
- `GET /{id}` - Get full image
- `GET /thumbnail/{id}` - Get thumbnail
- `GET /metadata/{id}` - Get EXIF metadata
- `DELETE /{id}` - Delete image

### Batches (`/batches`)
- `POST /` - Create batch
- `GET /` - List batches
- `GET /{id}` - Get batch details
- `PUT /{id}/analyze` - Run clustering
- `POST /{id}/images` - Add images to batch
- `PUT /{id}/groups` - Update group labels

## 🗄️ Database Schema

```mermaid
erDiagram
    Image ||--o{ ImageBatchAssociation : has
    ImageBatch ||--o{ ImageBatchAssociation : contains
    
    Image {
        uuid id PK
        string filename
        string file_path
        string image_hash
        binary features
        int width
        int height
        float[] quality_scores
        json metadata
    }
    
    ImageBatch {
        uuid id PK
        string batch_name
        string status
        json parameters
        timestamp created_at
    }
    
    ImageBatchAssociation {
        uuid batch_id FK
        uuid image_id FK
        string group_label
    }
```

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# Services:
# - PostgreSQL: localhost:5432
# - Backend: localhost:8000
# - Frontend: localhost:3000
```
