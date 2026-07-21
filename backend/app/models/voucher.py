from sqlalchemy import Column, Integer, String, Boolean, Numeric, TIMESTAMP
from sqlalchemy.sql import func
from app.core.database import Base

class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_percent = Column(Integer, nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=True)
    max_discount = Column(Numeric(10, 2), nullable=True)
    min_order_value = Column(Numeric(10, 2), nullable=True)
    start_date = Column(TIMESTAMP, nullable=False)
    end_date = Column(TIMESTAMP, nullable=False)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
