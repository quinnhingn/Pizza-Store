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
    offset = (page - 1) * page_size

    # Count all products
    count_query = select(func.count()).select_from(Product)
    total_count = await db.scalar(count_query)

    # Get products and left join reviews to aggregate
    # Using asyncpg requires careful grouping or simple python processing
    # Since we can just query all products and their reviews, let's do a subquery or python loop
    # For pagination, we paginate products
    query = select(Product).order_by(Product.id).offset(offset).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    items = []
    if products:
        product_ids = [p.id for p in products]
        
        # Get all reviews for these products
        review_query = select(
            Review.product_id, 
            func.count(Review.id).label('total'), 
            func.avg(Review.rating).label('avg'),
            func.sum(case((Review.is_read == False, 1), else_=0)).label('new_count')
        ).where(Review.product_id.in_(product_ids)).group_by(Review.product_id)
        
        review_result = await db.execute(review_query)
        review_stats = {r.product_id: r for r in review_result.all()}

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
    offset = (page - 1) * page_size

    count_query = select(func.count()).select_from(Review).where(Review.product_id == product_id)
    total_count = await db.scalar(count_query)

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
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    
    if not review:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
        
    await db.delete(review)
    await db.commit()
    
    return {"message": "Đã xóa đánh giá"}
