from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, UniqueConstraint, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base

class UserVoucher(Base):
    __tablename__ = "user_vouchers"
    __table_args__ = (
        UniqueConstraint("user_id", "voucher_code", name="uq_user_voucher_code"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    voucher_code = Column(String(50), ForeignKey("vouchers.code", ondelete="CASCADE"), nullable=False, index=True)
    is_used = Column(Boolean, default=False)
    saved_at = Column(TIMESTAMP, server_default=func.now())
