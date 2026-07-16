from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.core.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.product import Ingredient
from app.schemas.ingredient import IngredientCreate, IngredientUpdate, IngredientResponse

router = APIRouter()

@router.get("", response_model=List[IngredientResponse])
async def get_ingredients(db: AsyncSession = Depends(get_db)):
    """Get all master ingredients (sorted alphabetically by name)."""
    stmt = select(Ingredient).order_by(Ingredient.name.asc())
    result = await db.execute(stmt)
    ingredients = result.scalars().all()
    return ingredients

@router.get("/{ingredient_id}", response_model=IngredientResponse)
async def get_ingredient(ingredient_id: int, db: AsyncSession = Depends(get_db)):
    """Get single master ingredient by ID."""
    stmt = select(Ingredient).where(Ingredient.id == ingredient_id)
    result = await db.execute(stmt)
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguyên liệu này")
    return ingredient

@router.post("", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
async def create_ingredient(
    payload: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Create a new master ingredient (Admin only)."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(status_code=400, detail="Tên nguyên liệu không được để trống")

    # Check case-insensitive duplicate
    stmt = select(Ingredient).where(func.lower(Ingredient.name) == func.lower(clean_name))
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Nguyên liệu này đã tồn tại trong từ điển gốc")

    new_ingredient = Ingredient(name=clean_name)
    db.add(new_ingredient)
    await db.commit()
    await db.refresh(new_ingredient)
    return new_ingredient

@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: int,
    payload: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Update a master ingredient name (Admin only)."""
    stmt = select(Ingredient).where(Ingredient.id == ingredient_id)
    result = await db.execute(stmt)
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguyên liệu này")

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Tên nguyên liệu không được để trống")
        
        if func.lower(clean_name) != func.lower(ingredient.name):
            # Check duplicate
            stmt_check = select(Ingredient).where(func.lower(Ingredient.name) == func.lower(clean_name))
            res_check = await db.execute(stmt_check)
            if res_check.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Tên nguyên liệu mới đã bị trùng với một nguyên liệu khác")
        
        ingredient.name = clean_name

    await db.commit()
    await db.refresh(ingredient)
    return ingredient

@router.delete("/{ingredient_id}")
async def delete_ingredient(
    ingredient_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """Delete a master ingredient (Admin only)."""
    stmt = select(Ingredient).where(Ingredient.id == ingredient_id)
    result = await db.execute(stmt)
    ingredient = result.scalar_one_or_none()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Không tìm thấy nguyên liệu này")

    await db.delete(ingredient)
    await db.commit()
    return {"message": "Đã xóa nguyên liệu gốc thành công"}
