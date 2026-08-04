from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BannerBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: str
    link_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class BannerCreate(BannerBase):
    pass

class BannerUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class BannerResponse(BannerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
