<div align="center">
  <img src="assets/logo-with-branding.png" alt="PIXSORT Logo" width="400">
  <h3>Self-Hosted Image Organization & Analysis Platform</h3>
  <p>Take control of your photo library with a powerful self-hosted solution. Automatically cluster images by visual similarity, extract metadata, assess quality, and organize thousands of photos—all running on your own infrastructure with complete privacy.</p>
</div>

## Demo with images of various types
<div align="center">
  <img src="assets/Screenshot_20251027_021551.png" alt="Cluster Screenshot" width="100%">
</div>

## Core Features

* **Project Batches:** Group images into batches for analysis.
* **Image Upload:** Drag-and-drop uploads with file-hash duplicate detection.
* **ML Clustering:** Run analysis to find visual clusters with tunable parameters.
* **Metadata Inspection:** Automatically extracts and displays EXIF data (camera, GPS, shot time) for each image
* **Grouped View:** Toggle between viewing all images and viewing them grouped by their cluster
* **Async Processing:** Feature extraction and thumbnail generation run as background tasks.

## Tech Stack

* **Backend:** Python (FastAPI), PostgreSQL (SQLAlchemy), DINOv3 (feature extraction), HDBSCAN (clustering)
* **Frontend:** Next.js 15, TypeScript, HeroUI, TanStack Query
* **Utility:** Docker Compose, Alembic (migrations), OpenAPI (auto-generated client)

## Quick Start with Docker 🐳

The easiest way to run PIXSORT is using Docker Compose:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd pixal-judge

# 2. Copy environment file
cp .env.example .env

# 3. Build and start all services
docker-compose up --build

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

For detailed Docker setup, custom domains, and troubleshooting, see [DOCKER.md](DOCKER.md).

## Manual Development Setup

**Important:** Run database migrations before starting the server:
```bash
cd server
alembic upgrade head
python run_server.py
```

See detailed guides:
- [Server/Backend Setup](server/README.md)
- [Web/Frontend Setup](web/README.md)
- [Database Migrations](MIGRATIONS.md) - How to manage schema changes
