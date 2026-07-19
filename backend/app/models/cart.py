from sqlalchemy import Column, Integer, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    size_name = Column(String(50), nullable=True)
    toppings = Column(JSONB, default=list, nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    note = Column(String(255), nullable=True)
    unit_price = Column(Numeric(10, 2), default=0, nullable=False)
    total_price = Column(Numeric(10, 2), default=0, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    product = relationship("Product", lazy="joined")
