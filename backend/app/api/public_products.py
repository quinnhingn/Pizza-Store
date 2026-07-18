from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import func, and_, or_
from typing import Optional
from decimal import Decimal

from app.core.deps import get_db
from app.models.product import Product, Ingredient, ProductIngredient
from app.schemas.product import ProductResponse, PaginatedProductResponse

router = APIRouter()


@router.get("", response_model=PaginatedProductResponse)
async def get_public_products(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_available: Optional[bool] = Query(None, description="Filter by availability status"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price filter"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price filter"),
    search: Optional[str] = Query(None, description="Search keyword in product name or ingredient name"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(12, ge=1, le=100, description="Number of items per page"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get paginated list of products with filtering and search (Public Customer endpoint).
    Returns both available and unavailable items by default so customer UI can display 'Hết món' tag.
    Eagerly loads sizes, toppings, and ingredients for client-side pricing computation.
    """
    base_filters = []

    if is_available is not None:
        base_filters.append(Product.is_available == is_available)
    if category_id is not None:
        base_filters.append(Product.category_id == category_id)
    if min_price is not None:
        base_filters.append(Product.price >= min_price)
    if max_price is not None:
        base_filters.append(Product.price <= max_price)
    if search and search.strip():
        search_term = f"%{search.strip().lower()}%"
        base_filters.append(
            or_(
                Product.name.ilike(search_term),
                Product.ingredient_associations.any(
                    ProductIngredient.ingredient.has(Ingredient.name.ilike(search_term))
                )
            )
        )

    # Calculate total count
    count_stmt = select(func.count()).select_from(Product).where(and_(*base_filters)) if base_filters else select(func.count()).select_from(Product)
    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar() or 0

    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 1
    offset = (page - 1) * page_size

    # Fetch paginated items with eager loading
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

    return PaginatedProductResponse(
        items=items,
        total_count=total_count,
        total_pages=total_pages,
        page=page,
        page_size=page_size,
        total=total_count,
        limit=page_size
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_public_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Get single product details by ID (Public Customer endpoint).
    Returns product details regardless of availability status so UI can display status properly.
    """
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
    return product
