from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List, Dict, Any
from decimal import Decimal

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.cart import CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemResponse, CartSummaryResponse

router = APIRouter()

def normalize_toppings(toppings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not toppings:
        return []
    # Sắp xếp toppings theo tên để so sánh đồng nhất
    return sorted(toppings, key=lambda x: str(x.get("name", "") or x.get("topping_name", "")))

def toppings_match(top1: List[Dict[str, Any]], top2: List[Dict[str, Any]]) -> bool:
    norm1 = normalize_toppings(top1)
    norm2 = normalize_toppings(top2)
    if len(norm1) != len(norm2):
        return False
    for t1, t2 in zip(norm1, norm2):
        name1 = str(t1.get("name", "") or t1.get("topping_name", "")).strip().lower()
        name2 = str(t2.get("name", "") or t2.get("topping_name", "")).strip().lower()
        if name1 != name2:
            return False
    return True

@router.get("", response_model=CartSummaryResponse)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các sản phẩm trong giỏ hàng và tổng tiền cho user hiện tại."""
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .order_by(CartItem.id.asc())
    )
    items = result.scalars().all()

    total_items = sum(item.quantity for item in items)
    subtotal = sum(Decimal(str(item.total_price or 0)) for item in items)

    return CartSummaryResponse(
        items=items,
        total_items=total_items,
        subtotal=subtotal
    )

@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_item_to_cart(
    payload: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Thêm sản phẩm vào giỏ hàng. Nếu trùng thông số size, topping, note -> gộp số lượng."""
    # Kiểm tra sản phẩm có tồn tại và đang kinh doanh hay không
    prod_res = await db.execute(select(Product).where(Product.id == payload.product_id))
    product = prod_res.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if not product.is_available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sản phẩm hiện đang tạm ngưng bán")

    # Lấy toàn bộ cart items của user cùng product_id để kiểm tra gộp
    exist_res = await db.execute(
        select(CartItem).where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == payload.product_id
        )
    )
    existing_items = exist_res.scalars().all()

    matched_item = None
    target_note = (payload.note or "").strip().lower()
    target_size = (payload.size_name or "").strip().lower()

    for item in existing_items:
        item_note = (item.note or "").strip().lower()
        item_size = (item.size_name or "").strip().lower()
        if item_size == target_size and item_note == target_note:
            if toppings_match(item.toppings or [], payload.toppings or []):
                matched_item = item
                break

    if matched_item:
        matched_item.quantity += payload.quantity
        matched_item.unit_price = payload.unit_price
        matched_item.total_price = matched_item.unit_price * matched_item.quantity
        await db.commit()
        await db.refresh(matched_item)
        return matched_item

    # Nếu không trùng, tạo mới cart item
    total_calc = payload.unit_price * payload.quantity
    new_item = CartItem(
        user_id=current_user.id,
        product_id=payload.product_id,
        size_name=payload.size_name,
        toppings=payload.toppings,
        quantity=payload.quantity,
        note=payload.note,
        unit_price=payload.unit_price,
        total_price=total_calc
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật số lượng hoặc thuộc tính của sản phẩm trong giỏ."""
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if payload.quantity is not None:
        item.quantity = payload.quantity
    if payload.size_name is not None:
        item.size_name = payload.size_name
    if payload.toppings is not None:
        item.toppings = payload.toppings
    if payload.note is not None:
        item.note = payload.note
    if payload.unit_price is not None:
        item.unit_price = payload.unit_price

    # Tính lại tổng tiền
    item.total_price = Decimal(str(item.unit_price or 0)) * item.quantity

    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cart_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa 1 sản phẩm khỏi giỏ hàng."""
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    await db.delete(item)
    await db.commit()
    return None

@router.delete("/clear", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa toàn bộ sản phẩm trong giỏ hàng của user."""
    try:
        await db.execute(
            delete(CartItem).where(CartItem.user_id == current_user.id)
        )
        await db.commit()
    except Exception as e:
        print("ERROR IN CLEAR_CART:", repr(e))
        raise HTTPException(status_code=500, detail=f"Clear cart error: {repr(e)}")
    return None
