from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from app.schemas.product import ProductResponse

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    size_name: Optional[str] = None
    unit_price: float
    toppings: Optional[List[Any]] = []
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)

class OrderCreate(BaseModel):
    shipping_full_name: str
    shipping_phone: str
    shipping_address: str
    shipping_address_id: Optional[int] = None
    note: Optional[str] = None
    voucher_code: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    user_id: int
    order_code: str
    total_amount: float
    discount_amount: float
    voucher_code: Optional[str] = None
    status: str
    customer_confirmed: bool = False
    shipping_full_name: str
    shipping_address: str
    shipping_phone: str
    shipping_address_id: Optional[int] = None
    note: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str
