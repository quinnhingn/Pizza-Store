import os
import ssl
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Đọc các biến môi trường từ file .env
load_dotenv()

DATABASE_URL: str | None = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

# Tạo SSL context để kết nối an toàn với Neon PostgreSQL
ssl_context = ssl.create_default_context()

# Khởi tạo Async Engine cho PostgreSQL (Neon)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Tắt log SQL để tránh spam console
    future=True,
    connect_args={"ssl": ssl_context}
)

# Cấu hình AsyncSession để sử dụng xuyên suốt ứng dụng
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Giữ lại dữ liệu sau khi commit, tránh lazy load lỗi
    autoflush=False
)

# Lớp nền (Base) cho tất cả các model SQLAlchemy
Base = declarative_base()