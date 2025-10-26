
# Pixal Judge - Server (Backend)

This is the backend for the Pixal Judge application, a image processing and clustering API built with Python and FastAPI.

It handles all core logic, including file storage, database management, metadata extraction, machine learning feature embedding, and clustering analysis.

## Tech Stack

  * **Framework:** **FastAPI** for REST APIs.
  * **Database:** **PostgreSQL** for relational data storage.
  * **ORM:** **SQLAlchemy** for database interaction and modeling.
  * **Migrations:** **Alembic** for database schema version control.
  * **Data Validation:** **Pydantic** for API request/response schema validation.
  * **ML (Embeddings):** **PyTorch** with **Transformers** (specifically `DINOV3`) to generate vector embeddings from images.
  * **ML (Clustering):** **HDBSCAN** for density-based clustering of image features.
  * **Image Processing:** **Pillow** for thumbnail generation and metadata extraction.
  * **Async Tasks:** FastAPI's `BackgroundTasks` to offload heavy processing from the request-response cycle.

## Project Structure

```
server/
│
├── alembic/              # Database migration scripts
├── api/                  # FastAPI routers, schemas, and main app
│   ├── cluster_routes.py   # Endpoints for /batches
│   ├── image_routes.py     # Endpoints for /images
│   ├── main.py             # Main FastAPI app setup and startup events
│   ├── schemas.py          # Pydantic models for API validation
│   └── tasks.py            # Background task definitions (embeddings, thumbnails)
│
├── assets/               # (Created at runtime) Storage for images and thumbnails
├── crud/                 # CRUD operations (Create, Read, Update, Delete)
│   ├── crud_batch.py       # Database logic for batches
│   └── crud_image.py       # Database logic for images
│
├── database/             # Database connection and ORM models
│   ├── database.py         # SQLAlchemy engine and session setup
│   └── models.py           # SQLAlchemy table models (Image, ImageBatch)
│
├── processing/           # Core ML and image processing logic
│   ├── feature_extraction.py # DINOV3/ResNet models for embeddings
│   ├── grouping.py         # HDBSCAN clustering logic
│   └── metadata_extraction.py # EXIF metadata extraction
│
├── services/             # Business logic layer
│   ├── batch_service.py    # Orchestrates clustering and batch management
│   ├── image_service.py    # Handles image uploads, duplicates, and deletion
│   └── startup_service.py  # Checks for missing data on app start
│
├── utils/                # Utility functions
│   └── file_handling.py    # Saving files, creating thumbnails
│
├── .env                  # (Not tracked) Local environment variables
├── .gitignore
├── alembic.ini           # Alembic configuration
├── config.py             # Application configuration (loads .env)
├── docker-compose.yml    # Docker config for PostgreSQL database
├── example.env           # Template for environment variables
├── init.sql              # Database schema initialization
├── requirements.txt      # Python dependencies
└── run_server.py         # Entry point to run the server
```

## How It Works

### 1\. Application Startup

  * The FastAPI app is initialized.
  * Asset directories (`/assets/images`, `/assets/thumbnails`) are created if they don't exist.
  * Two background threads are started:
      * One to find all images missing embeddings and queue `generate_embedding_task` for them.
      * One to find all images missing thumbnails and queue `generate_thumbnail_task` for them.

### 2\. Image Upload Flow

1.  A request hits `POST /images/upload` with one or more files.
2.  `image_service.process_new_uploads` is called:
      * A SHA-256 hash is calculated for the file.
      * The database is checked for an existing image with the same hash.
      * If it's a duplicate, a response is returned noting the duplication.
      * If it's new, the file is saved to disk with a unique UUID filename.
      * Basic EXIF metadata (width, height, shot time, etc.) is extracted.
      * A new `Image` record is created in the database with the file info and metadata.
3.  Back in the API route, `BackgroundTasks` are queued for each *new* image:
      * `generate_thumbnail_task`: Creates a thumbnail.
      * `generate_embedding_task`: Uses the `DINOV3` model to generate a feature vector and save it to the `features` column of the image.

### 3\. Clustering Analysis Flow

1.  A request hits `PUT /batches/{batch_id}/analyze` with clustering parameters (e.g., `min_cluster_size`).
2.  `batch_service.analyze_batch` is called:
      * It fetches the batch and all its associated images.
      * It fails if any image is missing its feature embeddings.
      * It collects all image features into a single NumPy matrix.
      * An `ImageGrouper` instance is created with the user-provided parameters.
      * `hdbscan.fit_predict` is called on the feature matrix.
      * The resulting labels (e.g., `-1`, `0`, `1`, `2`) are mapped to human-readable names ("Ungrouped", "Group 1", "Group 2", etc.).
      * The `group_label` for each image in the `ImageBatchAssociation` table is updated with the result.
      * The batch `status` is set to "complete" and the updated batch is returned.

## Database

The application uses a **PostgreSQL** database with a custom schema named `image_clustering`. The schema is managed by **Alembic**.

### Key Models

  * **`Image`**: Stores all data for a single uploaded image.
      * `id`, `filename`, `original_filename`, `file_path`, `image_hash`
      * `features` (LargeBinary): The stored vector embedding.
      * Metadata fields: `width`, `height`, `shot_at`, `camera_make`, `iso`, etc.
  * **`ImageBatch`**: Represents a "project" or collection of images.
      * `id`, `batch_name`, `status`, `parameters` (JSON for cluster settings).
  * **`ImageBatchAssociation`**: A many-to-many link table connecting `Image` and `ImageBatch`.
      * `batch_id` (PK, FK)
      * `image_id` (PK, FK)
      * `group_label` (String): Stores the result of the clustering (e.g., "Group 1").

## API Endpoints

### Image Routes (`/images`)

  * `POST /upload`: Uploads one or more images.
  * `GET /`: Get a list of all images in the database.
  * `GET /{image_id}`: Serves the full-resolution image file.
  * `GET /thumbnail/{image_id}`: Serves the image thumbnail.
  * `GET /metadata/{image_id}`: Returns a JSON object of the image's stored metadata.
  * `DELETE /{image_id}`: Deletes an image from the database and its files from disk.

### Batch Routes (`/batches`)

  * `POST /`: Creates a new batch with a name and a list of image IDs.
  * `GET /`: Get a list of all batches.
  * `GET /{batch_id}`: Get detailed information for a single batch, including all its images and their group labels.
  * `PUT /{batch_id}`: Renames a batch.
  * `DELETE /{batch_id}`: Deletes a batch and its associations (but not the images themselves).
  * `POST /{batch_id}/images`: Adds existing images (by ID) to a batch.
  * `DELETE /{batch_id}/images`: Removes images (by ID) from a batch.
  * `POST /{batch_id}/upload-and-add`: A convenience endpoint that uploads new images and adds them to the specified batch in one call.
  * `PUT /{batch_id}/analyze`: Runs the clustering analysis on the batch.
  * `PUT /{batch_id}/groups`: Manually updates the group labels for images in a batch (e.g., from the UI).

## Setup and Running

1.  **Start the Database:**

      * Create a `.env` file from `example.env` and fill in your database credentials (username, password, db name).
      * Run `docker-compose up -d` to start the PostgreSQL container. This will also automatically run `init.sql` to create the `image_clustering` schema.

2.  **Create Python Environment:**

      * Create a virtual environment: `python -m venv .venv`
      * Activate it: `source .venv/bin/activate` (or `.\.venv\Scripts\activate` on Windows)
      * Install dependencies: `pip install -r requirements.txt`.

3.  **Run Database Migrations:**

      * Apply all database migrations to create the tables: `alembic upgrade head`

4.  **Run the Server:**

      * Execute the run script: `python run_server.py`.
      * The server will be running on `http://0.0.0.0:8000`.