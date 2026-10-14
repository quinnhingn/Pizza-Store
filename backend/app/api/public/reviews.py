from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.core.deps import get_db
from app.models.review import Review
from app.models.user import User
from app.schemas.review import PaginatedPublicReviews
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.get("/products/{product_id}/reviews", response_model=PaginatedPublicReviews)
async def get_product_reviews(
    product_id: int,
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách đánh giá của một sản phẩm (Public endpoint - dành cho khách hàng xem).
    Chỉ trả về review đã được duyệt hiển thị (is_visible = True), sắp xếp mới nhất trước.
    """
    offset = (page - 1) * page_size

    # Đếm tổng số review đang hiển thị của sản phẩm
    count_query = select(func.count()).select_from(Review).where(
        Review.product_id == product_id,
        Review.is_visible == True
    )
    total_count = await db.scalar(count_query)

    # Lấy danh sách review kèm thông tin người đánh giá (eager load user)
    query = select(Review).options(selectinload(Review.user)).where(
        Review.product_id == product_id,
        Review.is_visible == True
    ).order_by(Review.created_at.desc()).offset(offset).limit(page_size)

    result = await db.execute(query)
    reviews = result.scalars().all()

    total_pages = (total_count + page_size - 1) // page_size

    return PaginatedPublicReviews(
        items=reviews,
        total_count=total_count,
        total_pages=total_pages,
        page=page,
        page_size=page_size
    )
