from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order

router = APIRouter()

def require_admin(user: User = Depends(get_current_user)):
    """Hàm dependency kiểm tra quyền Admin. Từ chối nếu không phải Admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

class CustomerResponse(BaseModel):
    """Schema phản hồi thông tin khách hàng kèm thống kê đơn hàng và hạng thành viên."""
    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    created_at: datetime
    total_orders: int
    total_spent: float
    rank: str

    class Config:
        from_attributes = True

def determine_rank(total_spent: float) -> str:
    """
    Xác định hạng thành viên dựa trên tổng chi tiêu của khách hàng.
    Platinum >= 5tr | Gold >= 2tr | Silver >= 1tr | Bronze: còn lại.
    """
    if total_spent >= 5000000:
        return "Platinum"
    elif total_spent >= 2000000:
        return "Gold"
    elif total_spent >= 1000000:
        return "Silver"
    return "Bronze"

@router.get("/", response_model=List[CustomerResponse])
async def get_all_customers(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin only: Lấy danh sách toàn bộ khách hàng kèm thống kê đơn hàng và hạng thành viên.
    Sử dụng LEFT JOIN để bao gồm cả khách hàng chưa có đơn hoàn thành nào.
    """
    stmt = (
        select(
            User,
            func.count(Order.id).label("total_orders"),
            func.sum(Order.total_amount).label("total_spent")
        )
        .outerjoin(Order, (Order.user_id == User.id) & (Order.status == 'completed'))
        .where(User.role == "customer")
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    
    result = await db.execute(stmt)
    rows = result.all()
    
    # Xây dựng danh sách phản hồi với hạng thành viên được tính toán
    customers = []
    for user, total_orders, total_spent in rows:
        spent = float(total_spent or 0)
        customers.append(CustomerResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            total_orders=total_orders or 0,
            total_spent=spent,
            rank=determine_rank(spent)
        ))
        
    return customers

@router.put("/{user_id}/toggle-status")
async def toggle_customer_status(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """
    Admin only: Bật/tắt trạng thái hoạt động của tài khoản khách hàng.
    Tài khoản bị tắt sẽ không thể đăng nhập.
    """
    result = await db.execute(select(User).where(User.id == user_id, User.role == "customer"))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        
    user.is_active = not user.is_active
    await db.commit()
    
    return {"message": "Cập nhật trạng thái thành công", "is_active": user.is_active}
