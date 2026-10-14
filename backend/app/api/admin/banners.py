from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.banner import Banner
from app.schemas.banner import BannerCreate, BannerUpdate, BannerResponse

router = APIRouter()

def require_admin(user: User = Depends(get_current_user)):
    """Hàm dependency kiểm tra quyền Admin. Từ chối nếu không phải Admin."""
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

@router.get("/", response_model=List[BannerResponse])
async def get_all_banners(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Lấy toàn bộ banner (kể cả đã tắt) để quản trị viên quản lý."""
    result = await db.execute(select(Banner).order_by(Banner.display_order))
    return result.scalars().all()

@router.post("/", response_model=BannerResponse, status_code=status.HTTP_201_CREATED)
async def create_banner(
    banner_in: BannerCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Tạo banner mới. Nếu không cung cấp display_order, tự động đặt sau banner cuối cùng."""
    banner_data = banner_in.model_dump()
    if banner_data.get("display_order", 0) == 0:
        # Lấy thứ tự hiển thị lớn nhất hiện tại và cộng thêm 1
        result = await db.execute(select(Banner).order_by(Banner.display_order.desc()))
        max_banner = result.scalars().first()
        banner_data["display_order"] = (max_banner.display_order + 1) if max_banner else 1

    new_banner = Banner(**banner_data)
    db.add(new_banner)
    await db.commit()
    await db.refresh(new_banner)
    return new_banner

@router.put("/{banner_id}", response_model=BannerResponse)
async def update_banner(
    banner_id: int,
    banner_in: BannerUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Cập nhật thông tin banner (tiêu đề, ảnh, thứ tự, trạng thái)."""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalars().first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    
    update_data = banner_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(banner, field, value)
        
    await db.commit()
    await db.refresh(banner)
    return banner

@router.delete("/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_banner(
    banner_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Xóa hoàn toàn banner khỏi hệ thống."""
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalars().first()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
        
    await db.delete(banner)
    await db.commit()
    return None
