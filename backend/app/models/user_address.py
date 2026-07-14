from sqlalchemy import Column, Integer, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class UserAddress(Base):
    __tablename__ = "user_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line = Column(String(255), nullable=False)
    province = Column(String(50), nullable=False)
    district = Column(String(50), nullable=True)
    ward = Column(String(50), nullable=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
