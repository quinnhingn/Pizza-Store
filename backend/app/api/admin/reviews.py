from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case
from app.core.deps import get_db, get_current_admin_user
from app.models.review import Review
from app.models.product import Product
from app.schemas.review import (
    PaginatedAdminReviews, 
    PaginatedProductReviewAggregates, 
    ProductReviewAggregate
)
from sqlalchemy.orm import selectinload

router = APIRouter()

@router.get("/products", response_model=PaginatedProductReviewAggregates)
async def get_all_product_reviews(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin only: Lấy danh sách tất cả sản phẩm cùng thống kê đánh giá (phân trang).
    Bao gồm: điểm trung bình, tổng số review, và số review chưa đọc.
    """
    offset = (page - 1) * page_size

    # Đếm tổng số sản phẩm để tính phân trang
    count_query = select(func.count()).select_from(Product)
    total_count = await db.scalar(count_query)

    # Lấy danh sách sản phẩm theo trang (phân trang theo sản phẩm)
    query = select(Product).order_by(Product.id).offset(offset).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    items = []
    if products:
        product_ids = [p.id for p in products]
        
        # Truy vấn thống kê review cho tất cả sản phẩm trong trang này
        review_query = select(
            Review.product_id, 
            func.count(Review.id).label('total'), 
            func.avg(Review.rating).label('avg'),
            func.sum(case((Review.is_read == False, 1), else_=0)).label('new_count')  # Đếm review chưa đọc
        ).where(Review.product_id.in_(product_ids)).group_by(Review.product_id)
        
        review_result = await db.execute(review_query)
        review_stats = {r.product_id: r for r in review_result.all()}

        # Gắn thông tin thống kê vào từng sản phẩm
        for p in products:
            stats = review_stats.get(p.id)
            items.append(ProductReviewAggregate(
                product_id=p.id,
                product_name=p.name,
                image_url=p.image_url,
                average_rating=float(stats.avg) if stats and stats.avg else 0.0,
                total_reviews=int(stats.total) if stats and stats.total else 0,
                new_reviews_count=int(stats.new_count) if stats and stats.new_count else 0
            ))

    total_pages = (total_count + page_size - 1) // page_size

    return PaginatedProductReviewAggregates(
        items=items,
        total_count=total_count,
        total_pages=total_pages,
        page=page,
        page_size=page_size
    )

@router.get("/products/{product_id}", response_model=PaginatedAdminReviews)
async def get_product_reviews(
    product_id: int,
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin only: Lấy danh sách chi tiết tất cả review của một sản phẩm cụ thể (phân trang).
    Bao gồm cả review ẩn để Admin có thể quản lý.
    """
    offset = (page - 1) * page_size

    # Đếm tổng số review của sản phẩm
    count_query = select(func.count()).select_from(Review).where(Review.product_id == product_id)
    total_count = await db.scalar(count_query)

    # Lấy danh sách review kèm thông tin user, sắp xếp mới nhất trước
    query = select(Review).where(Review.product_id == product_id).options(selectinload(Review.user)).order_by(Review.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    reviews = result.scalars().all()

    total_pages = (total_count + page_size - 1) // page_size

    return PaginatedAdminReviews(
        items=reviews,
        total_count=total_count,
        total_pages=total_pages,
        page=page,
        page_size=page_size
    )

@router.patch("/products/{product_id}/mark-read")
async def mark_product_reviews_read(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin only: Đánh dấu tất cả review chưa đọc của một sản phẩm là đã đọc.
    Dùng khi Admin click vào sản phẩm để xem review.
    """
    query = select(Review).where(Review.product_id == product_id, Review.is_read == False)
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    for r in reviews:
        r.is_read = True
        
    await db.commit()
    return {"message": "Đã đánh dấu đã đọc", "updated_count": len(reviews)}

@router.patch("/{review_id}/visibility")
async def toggle_review_visibility(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin only: Bật/tắt trạng thái hiển thị của review (ẩn/hiện review vi phạm).
    Review bị ẩn sẽ không hiển thị cho khách hàng xem.
    """
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
        
    review.is_visible = not review.is_visible
    await db.commit()
    
    return {"message": "Cập nhật trạng thái thành công", "is_visible": review.is_visible}

@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin_user)
):
    """
    Admin only: Xóa vĩnh viễn một review khỏi hệ thống.
    """
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
        
    await db.delete(review)
    await db.commit()
    
    return {"message": "Đã xóa đánh giá"}
