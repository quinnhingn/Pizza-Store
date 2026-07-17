from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from decimal import Decimal

# ==================== SIZE SCHEMAS ====================
class SizeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Size name e.g. Size S, Size M")
    default_price_multiplier: float = Field(1.0, description="Multiplier for base price, e.g. 1.25 for +25%")
    default_extra_price: float = Field(0.0, description="Fixed extra price added, e.g. 30000")

class SizeCreate(SizeBase):
    pass

class SizeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    default_price_multiplier: Optional[float] = None
    default_extra_price: Optional[float] = None

class SizeResponse(SizeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ==================== TOPPING SCHEMAS ====================
class ToppingBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Topping name e.g. Thêm phô mai")
    default_extra_price: float = Field(0.0, description="Default extra price e.g. 20000")

class ToppingCreate(ToppingBase):
    pass

class ToppingUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    default_extra_price: Optional[float] = None

class ToppingResponse(ToppingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
