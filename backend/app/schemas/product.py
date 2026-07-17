from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class ProductSizeItem(BaseModel):
    id: Optional[int] = None
    size_name: str
    price_multiplier: float = 1.0
    extra_price: float = 0.0

    class Config:
        from_attributes = True


class ProductToppingItem(BaseModel):
    id: Optional[int] = None
    topping_name: str
    extra_price: float = 0.0

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_available: bool = True
    ingredients: List[str] = Field(default_factory=list)
    sizes: List[ProductSizeItem] = Field(default_factory=list)
    toppings: List[ProductToppingItem] = Field(default_factory=list)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    image_url: Optional[str] = None
    category_id: Optional[int] = None
    is_available: Optional[bool] = None
    ingredients: Optional[List[str]] = None
    sizes: Optional[List[ProductSizeItem]] = None
    toppings: Optional[List[ProductToppingItem]] = None


class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
