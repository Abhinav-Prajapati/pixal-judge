Image Clustering with DBSCAN and PostgreSQLThis project is a Python application that clusters images based on visual similarity. It uses a pre-trained ResNet50 model to extract feature vectors from images, stores these features in a PostgreSQL database, and then applies the DBSCAN clustering algorithm to group similar images together. The results, including a t-SNE visualization, are saved to an output directory.The application is designed to be modular and efficient, avoiding re-processing of images whose features are already stored in the database.FeaturesFeature Extraction: Uses a pre-trained ResNet50 model to generate high-dimensional feature vectors for images.Persistent Storage: Leverages a PostgreSQL database with a custom schema to store image paths and features, preventing redundant processing.DBSCAN Clustering: Applies the DBSCAN algorithm to cluster images based on the cosine or euclidean distance of their feature vectors.Modular Structure: Code is organized into distinct modules for configuration, database management, processing, and utilities.Visualization: Generates a 2D t-SNE plot to visualize the resulting clusters.File Organization: Automatically copies images into folders named after their assigned cluster.Efficient Package Management: Uses uv for fast and reliable dependency management.Project Structureimage_clustering_app/
├── docker-compose.yml        # Docker configuration for the database
├── init.sql                  # SQL script to initialize the database schema
├── config.py                 # Application configuration (DB URL, schema)
├── database/
│   ├── database.py           # SQLAlchemy engine and session management
│   └── models.py             # Database table models (Image, ClusteringResult)
├── processing/
│   ├── clustering.py         # ImageClusterer class (DBSCAN logic)
│   └── feature_extraction.py # ImageFeatureExtractor class (ResNet50 logic)
├── utils/
│   └── visualization.py      # t-SNE plotting and file organization
├── main.py                   # Main application entry point
└── requirements.txt          # Project dependencies
Setup and InstallationFollow these steps to set up and run the application.Step 1: PrerequisitesDocker: Ensure you have Docker and Docker Compose installed to run the PostgreSQL database.Python: Python 3.8 or newer is recommended.uv: This project uses uv for package management. If you don't have it, install it with:pip install uv
Step 2: Start the DatabaseA docker-compose.yml file is provided to easily set up the PostgreSQL database.Navigate to the project's root directory.Start the database container in detached mode:docker-compose up -d
This command will pull the postgres:15 image, create a container named image_cluster_db, and run the init.sql script to create the image_clustering schema. The database will be accessible on localhost:5432.Step 3: Set Up the Python EnvironmentWe will use uv to create a virtual environment and install the required packages.Create a virtual environment:uv venv
This creates a .venv directory in your project folder.Activate the virtual environment:On macOS/Linux:source .venv/bin/activate
On Windows (PowerShell):.venv\Scripts\Activate.ps1
Install dependencies:Use uv to install the packages listed in requirements.txt.uv pip install -r requirements.txt
How to Run the ApplicationThe main.py script is the entry point for the application. It requires an image directory and provides several optional arguments to control the clustering process.Basic UsageTo run the clustering on a folder of images, use the following command:python main.py --image_dir /path/to/your/images
Example with Custom ParametersYou can customize the DBSCAN parameters (eps and min_samples) and the output directory.python main.py \
    --image_dir ./my_dataset \
    --output_dir ./results_run_1 \
    --eps 0.4 \
    --min_samples 3
Command-Line Arguments--image_dir (required): The path to the directory containing the images you want to cluster.--output_dir (optional): The directory where results (cluster folders, t-SNE plot, summary) will be saved. Defaults to clustering_results.--eps (optional): The eps parameter for DBSCAN, which defines the maximum distance between two samples for one to be considered as in the neighborhood of the other. Defaults to 0.3.--min_samples (optional): The min_samples parameter for DBSCAN, which is the number of samples in a neighborhood for a point to be considered as a core point. Defaults to 2.--metric (optional): The distance metric to use (cosine or euclidean). Defaults to cosine.OutputAfter a successful run, the specified --output_dir will contain:Cluster Folders: Directories named cluster_0, cluster_1, etc., containing the images assigned to each cluster.noise Folder: A directory containing images that were not assigned to any cluster.clustering_visualization.png: A t-SNE plot visualizing the clusters.clustering_summary.txt: A text file with statistics about the clustering run (e.g., number of clusters, number of noise points, and images per cluster).
