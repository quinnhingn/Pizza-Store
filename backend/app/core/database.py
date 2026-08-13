import os
import ssl
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load environment variables from .env file
load_dotenv()

DATABASE_URL: str | None = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

# Create SSL context for Neon PostgreSQL
ssl_context = ssl.create_default_context()

# Initialize Async Engine for PostgreSQL (Neon)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Disabled to avoid spamming terminal
    future=True,
    connect_args={"ssl": ssl_context}
)

# Configure Async Session Local
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

# Base class for SQLAlchemy models
Base = declarative_base()