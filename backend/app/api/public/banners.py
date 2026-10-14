from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.deps import get_db
from app.models.banner import Banner
from app.schemas.banner import BannerResponse

router = APIRouter()

@router.get("/", response_model=List[BannerResponse])
async def get_active_banners(db: AsyncSession = Depends(get_db)):
    """
    Lấy danh sách banner đang hoạt động, sắp xếp theo thứ tự hiển thị (Public endpoint).
    Chỉ trả về banner có is_active = True để hiển thị trên trang chủ.
    """
    result = await db.execute(
        select(Banner)
        .where(Banner.is_active == True)
        .order_by(Banner.display_order)
    )
    return result.scalars().all()
