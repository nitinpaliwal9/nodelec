# database.py

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import (
    declarative_base,
    sessionmaker
)

# ==========================================================
# DATABASE CONFIG
# ==========================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/bom_matcher"
)

# ==========================================================
# ENGINE
# ==========================================================

engine = create_engine(
    DATABASE_URL,

    # Automatically recover dead connections
    pool_pre_ping=True,

    # Production-friendly pool settings
    pool_size=10,
    max_overflow=20,

    # Recycle stale PostgreSQL connections
    pool_recycle=3600,

    # Future SQLAlchemy compatibility
    future=True
)

# ==========================================================
# SESSION FACTORY
# ==========================================================

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

# ==========================================================
# ORM BASE
# ==========================================================

Base = declarative_base()

# ==========================================================
# FASTAPI DEPENDENCY
# ==========================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()