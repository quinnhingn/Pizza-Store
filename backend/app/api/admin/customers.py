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
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

class CustomerResponse(BaseModel):
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
    result = await db.execute(select(User).where(User.id == user_id, User.role == "customer"))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Khách hàng không tồn tại")
        
    user.is_active = not user.is_active
    await db.commit()
    
    return {"message": "Cập nhật trạng thái thành công", "is_active": user.is_active}
