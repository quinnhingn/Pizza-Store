from sqlalchemy import Column, Integer, String, Numeric, Text, TIMESTAMP, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_code = Column(String(50), unique=True, nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    voucher_code = Column(String(50), ForeignKey("vouchers.code", ondelete="SET NULL"), nullable=True)
    status = Column(String(30), default="pending")
    customer_confirmed = Column(Boolean, default=False)
    shipping_full_name = Column(String(100), nullable=False)
    shipping_address = Column(Text, nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    shipping_address_id = Column(Integer, ForeignKey("user_addresses.id", ondelete="SET NULL"), nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="joined")
    user = relationship("User", lazy="select")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    size_name = Column(String(20), nullable=True)
    unit_price = Column(Numeric(10, 2), nullable=False)
    toppings = Column(JSONB, default=list, nullable=True)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", lazy="joined")
