from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional

from app.core.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.product import Product, Ingredient, ProductIngredient
from app.models.category import Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse

router = APIRouter()

async def _sync_product_ingredients(db: AsyncSession, product_id: int, ingredients_list: List[str]):
    """Helper to sync product ingredients with the ingredients and product_ingredients tables."""
    # Delete existing associations for this product
    await db.execute(delete(ProductIngredient).where(ProductIngredient.product_id == product_id))
    
    seen_names = set()
    for raw_name in ingredients_list:
        name = raw_name.strip()
        if not name or name.lower() in seen_names:
            continue
        seen_names.add(name.lower())

        # Check if ingredient exists
        stmt = select(Ingredient).where(Ingredient.name == name)
        res = await db.execute(stmt)
        ing = res.scalar_one_or_none()
        if not ing:
            ing = Ingredient(name=name)
            db.add(ing)
            await db.flush()
            
        assoc = ProductIngredient(product_id=product_id, ingredient_id=ing.id)
        db.add(assoc)

async def _get_product_with_details(db: AsyncSession, product_id: int) -> Optional[Product]:
    """Fetch product with eager loaded ingredient associations."""
    db.expire_all()
    stmt = (
        select(Product)
        .options(selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient))
        .where(Product.id == product_id)
    )
    res = await db.execute(stmt)
    return res.scalar_one_or_none()

@router.get("", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    is_available: Optional[bool] = Query(None, description="Filter by availability status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Get list of products with optional filtering (Public endpoint)."""
    stmt = (
        select(Product)
        .options(selectinload(Product.ingredient_associations).joinedload(ProductIngredient.ingredient))
    )
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if is_available is not None:
        stmt = stmt.where(Product.is_available == is_available)

    stmt = stmt.order_by(Product.id.asc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    products = result.scalars().all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """Get single product by ID (Public endpoint)."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Create a new product (Admin only)."""
    # Check if category exists if provided
    if payload.category_id is not None:
        stmt_cat = select(Category).where(Category.id == payload.category_id)
        res_cat = await db.execute(stmt_cat)
        if not res_cat.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category ID does not exist")

    product_data = payload.model_dump(exclude={"ingredients"})
    new_product = Product(**product_data)
    db.add(new_product)
    await db.flush()  # flush to get new_product.id

    if payload.ingredients:
        await _sync_product_ingredients(db, new_product.id, payload.ingredients)

    await db.commit()
    return await _get_product_with_details(db, new_product.id)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Update an existing product (Admin only)."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.category_id is not None and payload.category_id != product.category_id:
        stmt_cat = select(Category).where(Category.id == payload.category_id)
        res_cat = await db.execute(stmt_cat)
        if not res_cat.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Category ID does not exist")

    update_data = payload.model_dump(exclude_unset=True, exclude={"ingredients"})
    for key, value in update_data.items():
        setattr(product, key, value)

    if payload.ingredients is not None:
        await _sync_product_ingredients(db, product.id, payload.ingredients)

    await db.commit()
    return await _get_product_with_details(db, product.id)

@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Delete a product (Admin only)."""
    product = await _get_product_with_details(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()
    return {"message": "Product deleted successfully"}
