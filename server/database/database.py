# File: database/database.py
"""
Manages the database connection and session.
Provides a centralized way to interact with the database.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import DATABASE_URL, DB_SCHEMA

# Define Base here to avoid circular imports
Base = declarative_base()

# The connect_args option sets the default search path to our custom schema.
engine = create_engine(
    DATABASE_URL,
    connect_args={'options': f'-csearch_path={DB_SCHEMA}'}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Creates all tables in the database based on the defined models."""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Provides a database session for a single request or operation."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()