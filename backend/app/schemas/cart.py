from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Dict
from datetime import datetime
from decimal import Decimal
from app.schemas.product import ProductResponse

class CartItemBase(BaseModel):
    product_id: int
    size_name: Optional[str] = None
    toppings: List[Dict[str, Any]] = []
    quantity: int = Field(default=1, ge=1)
    note: Optional[str] = None
    unit_price: Decimal = Decimal("0.00")
    total_price: Decimal = Decimal("0.00")

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: Optional[int] = Field(default=None, ge=1)
    note: Optional[str] = None
    size_name: Optional[str] = None
    toppings: Optional[List[Dict[str, Any]]] = None
    unit_price: Optional[Decimal] = None
    total_price: Optional[Decimal] = None

class CartItemResponse(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    product: Optional[ProductResponse] = None

    model_config = ConfigDict(from_attributes=True)

class CartSummaryResponse(BaseModel):
    items: List[CartItemResponse]
    total_items: int
    subtotal: Decimal
