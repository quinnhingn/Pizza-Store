from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from typing import List

from app.core.deps import get_db, get_current_user, get_current_admin_user
from app.models.user import User
from app.models.user_address import UserAddress
from app.schemas.user import UserData
from app.schemas.user_address import AddressCreate, AddressUpdate, AddressResponse, ProfileUpdate

router = APIRouter()

@router.get("/admin/customers", response_model=List[UserData])
async def get_all_customers_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Admin only: Get list of all active customer profiles for gifting or management."""
    stmt = select(User).where(User.role == "customer", User.is_active == True).order_by(User.id.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/me", response_model=UserData)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current logged-in user profile."""
    return current_user

@router.put("/me", response_model=UserData)
async def update_my_profile(
    payload: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile (full_name)."""
    current_user.full_name = payload.full_name
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/me/addresses", response_model=List[AddressResponse])
async def get_my_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get list of addresses for current user, sorted by default first, then newest."""
    stmt = (
        select(UserAddress)
        .where(UserAddress.user_id == current_user.id)
        .order_by(UserAddress.is_default.desc(), UserAddress.created_at.desc())
    )
    result = await db.execute(stmt)
    addresses = result.scalars().all()
    return addresses

@router.post("/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    payload: AddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new address for current user."""
    # Check existing addresses
    stmt = select(UserAddress).where(UserAddress.user_id == current_user.id)
    result = await db.execute(stmt)
    existing_addresses = result.scalars().all()

    is_default = payload.is_default
    if not existing_addresses:
        # First address must be default
        is_default = True
    elif is_default:
        # Unset previous default addresses
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == current_user.id)
            .values(is_default=False)
        )

    data = payload.model_dump()
    data["is_default"] = is_default

    new_address = UserAddress(user_id=current_user.id, **data)
    db.add(new_address)
    await db.commit()
    await db.refresh(new_address)
    return new_address

@router.put("/me/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing address."""
    stmt = select(UserAddress).where(
        UserAddress.id == address_id,
        UserAddress.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    if payload.is_default is True:
        # Unset previous defaults
        await db.execute(
            update(UserAddress)
            .where(UserAddress.user_id == current_user.id, UserAddress.id != address_id)
            .values(is_default=False)
        )

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(address, key, value)

    await db.commit()
    await db.refresh(address)
    return address

@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an address."""
    stmt = select(UserAddress).where(
        UserAddress.id == address_id,
        UserAddress.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    was_default = address.is_default
    await db.delete(address)
    await db.commit()

    if was_default:
        # Assign default to the newest remaining address if available
        stmt_remaining = (
            select(UserAddress)
            .where(UserAddress.user_id == current_user.id)
            .order_by(UserAddress.created_at.desc())
            .limit(1)
        )
        res_remaining = await db.execute(stmt_remaining)
        newest_remaining = res_remaining.scalar_one_or_none()
        if newest_remaining:
            newest_remaining.is_default = True
            await db.commit()

    return {"message": "Address deleted successfully"}

@router.put("/me/addresses/{address_id}/default")
async def set_default_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set an address as default."""
    stmt = select(UserAddress).where(
        UserAddress.id == address_id,
        UserAddress.user_id == current_user.id
    )
    result = await db.execute(stmt)
    address = result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.execute(
        update(UserAddress)
        .where(UserAddress.user_id == current_user.id)
        .values(is_default=False)
    )
    address.is_default = True
    await db.commit()
    await db.refresh(address)

    return {
        "message": "Default address updated successfully",
        "address": AddressResponse.model_validate(address)
    }
