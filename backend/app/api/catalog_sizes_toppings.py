from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import Base
from app.core.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.product import Size, Topping
from app.schemas.catalog import (
    SizeCreate, SizeUpdate, SizeResponse,
    ToppingCreate, ToppingUpdate, ToppingResponse
)

router_sizes = APIRouter(tags=["Master Catalog - Sizes"])
router_toppings = APIRouter(tags=["Master Catalog - Toppings"])

# ==========================================
# MASTER SIZES ENDPOINTS
# ==========================================

@router_sizes.get("", response_model=List[SizeResponse])
async def get_sizes(db: AsyncSession = Depends(get_db)):
    """Get all master sizes."""
    result = await db.execute(select(Size).order_by(Size.name.asc()))
    return result.scalars().all()


@router_sizes.post("", response_model=SizeResponse, status_code=status.HTTP_201_CREATED)
async def create_size(
    size_in: SizeCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Create a new master size template."""
    result = await db.execute(select(Size).where(func_lower(Size.name) == size_in.name.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Size with this name already exists in master catalog")

    size = Size(
        name=size_in.name,
        default_price_multiplier=size_in.default_price_multiplier,
        default_extra_price=size_in.default_extra_price
    )
    db.add(size)
    await db.commit()
    await db.refresh(size)
    return size


@router_sizes.put("/{size_id}", response_model=SizeResponse)
async def update_size(
    size_id: int,
    size_in: SizeUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Update master size."""
    result = await db.execute(select(Size).where(Size.id == size_id))
    size = result.scalars().first()
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")

    if size_in.name is not None and size_in.name != size.name:
        existing = await db.execute(select(Size).where(func_lower(Size.name) == size_in.name.lower()))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Size with this name already exists")
        size.name = size_in.name

    if size_in.default_price_multiplier is not None:
        size.default_price_multiplier = size_in.default_price_multiplier
    if size_in.default_extra_price is not None:
        size.default_extra_price = size_in.default_extra_price

    await db.commit()
    await db.refresh(size)
    return size


@router_sizes.delete("/{size_id}", status_code=status.HTTP_200_OK)
async def delete_size(
    size_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete master size."""
    result = await db.execute(select(Size).where(Size.id == size_id))
    size = result.scalars().first()
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")

    await db.delete(size)
    await db.commit()
    return {"detail": "Size deleted successfully"}


# ==========================================
# MASTER TOPPINGS ENDPOINTS
# ==========================================

@router_toppings.get("", response_model=List[ToppingResponse])
async def get_toppings(db: AsyncSession = Depends(get_db)):
    """Get all master toppings."""
    result = await db.execute(select(Topping).order_by(Topping.name.asc()))
    return result.scalars().all()


@router_toppings.post("", response_model=ToppingResponse, status_code=status.HTTP_201_CREATED)
async def create_topping(
    topping_in: ToppingCreate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Create a new master topping template."""
    result = await db.execute(select(Topping).where(func_lower(Topping.name) == topping_in.name.lower()))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Topping with this name already exists in master catalog")

    topping = Topping(
        name=topping_in.name,
        default_extra_price=topping_in.default_extra_price
    )
    db.add(topping)
    await db.commit()
    await db.refresh(topping)
    return topping


@router_toppings.put("/{topping_id}", response_model=ToppingResponse)
async def update_topping(
    topping_id: int,
    topping_in: ToppingUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Update master topping."""
    result = await db.execute(select(Topping).where(Topping.id == topping_id))
    topping = result.scalars().first()
    if not topping:
        raise HTTPException(status_code=404, detail="Topping not found")

    if topping_in.name is not None and topping_in.name != topping.name:
        existing = await db.execute(select(Topping).where(func_lower(Topping.name) == topping_in.name.lower()))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Topping with this name already exists")
        topping.name = topping_in.name

    if topping_in.default_extra_price is not None:
        topping.default_extra_price = topping_in.default_extra_price

    await db.commit()
    await db.refresh(topping)
    return topping


@router_toppings.delete("/{topping_id}", status_code=status.HTTP_200_OK)
async def delete_topping(
    topping_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Delete master topping."""
    result = await db.execute(select(Topping).where(Topping.id == topping_id))
    topping = result.scalars().first()
    if not topping:
        raise HTTPException(status_code=404, detail="Topping not found")

    await db.delete(topping)
    await db.commit()
    return {"detail": "Topping deleted successfully"}


def func_lower(col):
    from sqlalchemy import func
    return func.lower(col)
