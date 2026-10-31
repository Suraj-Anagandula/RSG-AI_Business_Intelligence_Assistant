"""
Database Connection and Session Management.
Uses SQLAlchemy to connect to PostgreSQL.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

# Create database engine
engine = create_engine(DATABASE_URL, echo=False)

# Session factory for database transactions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy ORM models
Base = declarative_base()

def get_db():
    """
    FastAPI dependency to get a database session and close it after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

