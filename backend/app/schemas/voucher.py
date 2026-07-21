from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VoucherBase(BaseModel):
    code: str
    discount_percent: Optional[int] = None
    discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    min_order_value: Optional[float] = None
    start_date: datetime
    end_date: datetime
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = True

class VoucherCreate(VoucherBase):
    pass

class VoucherResponse(VoucherBase):
    id: int
    used_count: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class VoucherValidateRequest(BaseModel):
    code: str
    order_value: float

class VoucherValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_amount: float
    message: str
    voucher_details: Optional[VoucherResponse] = None

class VoucherUpdate(BaseModel):
    code: Optional[str] = None
    discount_percent: Optional[int] = None
    discount_amount: Optional[float] = None
    max_discount: Optional[float] = None
    min_order_value: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    usage_limit: Optional[int] = None
    is_active: Optional[bool] = None

class VoucherGiftRequest(BaseModel):
    send_to_all: bool = False
    user_ids: Optional[list[int]] = []
    custom_message: Optional[str] = None

class SaveVoucherRequest(BaseModel):
    code: str
    notification_id: Optional[int] = None

class UserVoucherResponse(BaseModel):
    id: int
    user_id: int
    voucher_code: str
    is_used: bool
    saved_at: Optional[datetime] = None
    voucher_details: Optional[VoucherResponse] = None

    model_config = ConfigDict(from_attributes=True)
