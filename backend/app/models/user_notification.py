from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base

class UserNotification(Base):
    __tablename__ = "user_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="voucher_gift")  # e.g., 'voucher_gift', 'system', 'order_status'
    reference_code = Column(String(100), nullable=True, index=True)  # e.g., voucher code
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
