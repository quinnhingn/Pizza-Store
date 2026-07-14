from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AddressCreate(BaseModel):
    full_name: str
    phone: str
    address_line: str
    province: str
    district: Optional[str] = None
    ward: Optional[str] = None
    is_default: bool = False

class AddressUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address_line: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    ward: Optional[str] = None
    is_default: Optional[bool] = None

class AddressResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: str
    address_line: str
    province: str
    district: Optional[str] = None
    ward: Optional[str] = None
    is_default: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    full_name: str
