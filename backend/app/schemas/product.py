from pydantic import BaseModel, Field, model_validator
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
    average_rating: float = 0.0
    total_reviews: int = 0

    class Config:
        from_attributes = True


class PaginatedProductResponse(BaseModel):
    items: List[ProductResponse]
    total_count: int
    total_pages: int
    page: int
    page_size: int
    total: Optional[int] = None
    limit: Optional[int] = None

    @model_validator(mode="after")
    def set_compatibility_fields(self) -> "PaginatedProductResponse":
        if self.total is None:
            self.total = self.total_count
        if self.limit is None:
            self.limit = self.page_size
        return self
