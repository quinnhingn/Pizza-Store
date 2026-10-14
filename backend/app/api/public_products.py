from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func, and_, or_
from typing import Optional
from decimal import Decimal

from app.core.deps import get_db
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.review import Review
from app.schemas.product import ProductResponse, PaginatedProductResponse

router = APIRouter()


@router.get("", response_model=PaginatedProductResponse)
async def get_public_products(
    category_id: Optional[int] = Query(None, description="Lọc theo ID danh mục"),
    is_available: Optional[bool] = Query(None, description="Lọc theo trạng thái kinh doanh"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Giá tối thiểu"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Giá tối đa"),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên sản phẩm hoặc tên nguyên liệu"),
    page: int = Query(1, ge=1, description="Trang hiện tại (bắt đầu từ 1)"),
    page_size: int = Query(12, ge=1, le=100, description="Số sản phẩm mỗi trang"),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách sản phẩm phân trang có hỗ trợ lọc và tìm kiếm (Public - dành cho khách hàng).
    Trả về cả sản phẩm đang bán và tạm ngưng để giao diện có thể hiển thị tag 'Hết món'.
    Tải sẵn (eager load) sizes, toppings, và nguyên liệu để client tính giá phía client.
    """
    base_filters = []

    # Xây dựng danh sách điều kiện lọc từ các tham số query
    if is_available is not None:
        base_filters.append(Product.is_available == is_available)
    if category_id is not None:
        base_filters.append(Product.category_id == category_id)
    if min_price is not None:
        base_filters.append(Product.price >= min_price)
    if max_price is not None:
        base_filters.append(Product.price <= max_price)
    if search and search.strip():
        # Tìm kiếm theo tên sản phẩm HOẶC tên nguyên liệu (không phân biệt hoa thường)
        search_term = f"%{search.strip().lower()}%"
        base_filters.append(
            or_(
                Product.name.ilike(search_term),
                Product.ingredient_associations.any(
                    ProductIngredient.ingredient.has(Ingredient.name.ilike(search_term))
                )
            )
        )

    # Đếm tổng số sản phẩm khớp với điều kiện lọc
    count_stmt = select(func.count()).select_from(Product).where(and_(*base_filters)) if base_filters else select(func.count()).select_from(Product)
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    # Tính tổng số trang và offset
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    offset = (page - 1) * page_size

    # Lấy danh sách sản phẩm theo trang, eager load các quan hệ liên quan
    stmt = (
        select(Product)
        .options(
            selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient),
            selectinload(Product.size_associations),
            selectinload(Product.topping_associations)
        )
    )
    if base_filters:
        stmt = stmt.where(and_(*base_filters))
    stmt = stmt.order_by(Product.id.asc()).offset(offset).limit(page_size)
    result = await db.execute(stmt)
    items = result.scalars().all()

    # Tính toán điểm đánh giá trung bình và tổng số review cho từng sản phẩm
    if items:
        product_ids = [p.id for p in items]
        review_query = select(
            Review.product_id,
            func.count(Review.id).label('total'),
            func.avg(Review.rating).label('avg')
        ).where(
            and_(
                Review.product_id.in_(product_ids),
                Review.is_visible == True  # Chỉ tính review đã được duyệt hiển thị
            )
        ).group_by(Review.product_id)
        
        review_res = await db.execute(review_query)
        review_stats = {r.product_id: r for r in review_res.all()}

        # Gắn thông tin review vào từng sản phẩm
        for p in items:
            stats = review_stats.get(p.id)
            p.average_rating = float(stats.avg) if stats and stats.avg else 0.0
            p.total_reviews = int(stats.total) if stats and stats.total else 0

    return {
        "items": items,
        "total_count": total_count,
        "total_pages": total_pages,
        "page": page,
        "page_size": page_size,
        "total": total_count,
        "limit": page_size
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_public_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy thông tin chi tiết của một sản phẩm theo ID (Public - dành cho khách hàng).
    Trả về bất kể trạng thái kinh doanh để giao diện hiển thị đúng trạng thái.
    """
    # Xóa cache session để đảm bảo lấy dữ liệu mới nhất từ DB
    db.expire_all()
    stmt = (
        select(Product)
        .options(
            selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient),
            selectinload(Product.size_associations),
            selectinload(Product.topping_associations)
        )
        .where(Product.id == product_id)
    )
    res = await db.execute(stmt)
    product = res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Tính điểm đánh giá trung bình và tổng số review cho sản phẩm này
    review_query = select(
        func.count(Review.id).label('total'),
        func.avg(Review.rating).label('avg')
    ).where(
        and_(
            Review.product_id == product_id,
            Review.is_visible == True  # Chỉ tính review đã được duyệt
        )
    )
    review_res = await db.execute(review_query)
    stats = review_res.first()
    product.average_rating = float(stats.avg) if stats and stats.avg else 0.0
    product.total_reviews = int(stats.total) if stats and stats.total else 0

    return product
