"""
Stores configuration variables for the application.
Centralizes settings for easy modification.
"""
import os

# Database connection URL for PostgreSQL.
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cluster_user:secure_password@localhost:5432/image_db")

# The custom schema name in the PostgreSQL database.
DB_SCHEMA = "image_clustering"
