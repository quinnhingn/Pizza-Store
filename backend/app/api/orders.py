from datetime import datetime
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.deps import get_db, get_current_user, get_current_admin_user
from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.voucher import Voucher
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate

router = APIRouter()

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new order from current user's cart using an atomic database transaction.
    - Validates cart is not empty.
    - Validates & applies voucher discount (if provided) and increments used_count.
    - Creates Order & OrderItems.
    - Clears user's cart items.
    """
    try:
        # 1. Fetch cart items with product loaded
        stmt = select(CartItem).where(CartItem.user_id == current_user.id)
        result = await db.execute(stmt)
        cart_items = result.scalars().all()

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Giỏ hàng đang trống, không thể đặt hàng."
            )

        # Calculate subtotal
        subtotal = sum(Decimal(str(item.total_price)) for item in cart_items)
        discount_amount = Decimal("0.00")
        voucher_code_clean = payload.voucher_code.strip().upper() if payload.voucher_code else None

        # 2. Validate and apply voucher if provided
        if voucher_code_clean:
            v_stmt = select(Voucher).where(Voucher.code == voucher_code_clean)
            v_result = await db.execute(v_stmt)
            voucher = v_result.scalar_one_or_none()

            if not voucher or not voucher.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mã giảm giá không tồn tại hoặc đã ngừng hoạt động."
                )

            now = datetime.now()
            if now < voucher.start_date or now > voucher.end_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mã giảm giá chưa đến hạn hoặc đã hết hạn sử dụng."
                )

            if voucher.usage_limit is not None and voucher.used_count >= voucher.usage_limit:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mã giảm giá đã hết lượt sử dụng."
                )

            if voucher.min_order_value is not None and subtotal < Decimal(str(voucher.min_order_value)):
                formatted_min = f"{float(voucher.min_order_value):,.0f}".replace(",", ".")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Đơn hàng cần đạt tối thiểu {formatted_min}đ để áp dụng mã này."
                )

            # Calculate discount
            if voucher.discount_percent is not None and voucher.discount_percent > 0:
                discount_amount = (subtotal * Decimal(str(voucher.discount_percent))) / Decimal("100")
            elif voucher.discount_amount is not None and voucher.discount_amount > 0:
                discount_amount = Decimal(str(voucher.discount_amount))

            if voucher.max_discount is not None and voucher.max_discount > 0:
                if discount_amount > Decimal(str(voucher.max_discount)):
                    discount_amount = Decimal(str(voucher.max_discount))

            if discount_amount > subtotal:
                discount_amount = subtotal

            # Increment voucher usage count inside transaction
            voucher.used_count += 1
            db.add(voucher)

        # 3. Calculate shipping fee and final total
        shipping_fee = Decimal("0.00") if subtotal >= Decimal("200000.00") else Decimal("25000.00")
        total_amount = subtotal - discount_amount + shipping_fee
        if total_amount < Decimal("0.00"):
            total_amount = Decimal("0.00")

        # 4. Create Order
        order_code = f"ORD-{int(datetime.now().timestamp())}-{current_user.id}"
        new_order = Order(
            user_id=current_user.id,
            order_code=order_code,
            total_amount=total_amount,
            discount_amount=discount_amount,
            voucher_code=voucher_code_clean,
            status="pending",
            shipping_full_name=payload.shipping_full_name,
            shipping_address=payload.shipping_address,
            shipping_phone=payload.shipping_phone,
            shipping_address_id=payload.shipping_address_id,
            note=payload.note
        )
        db.add(new_order)
        await db.flush()  # Flush to assign new_order.id

        # 5. Create OrderItems & clear CartItems
        for c_item in cart_items:
            o_item = OrderItem(
                order_id=new_order.id,
                product_id=c_item.product_id,
                quantity=c_item.quantity,
                size_name=c_item.size_name,
                unit_price=c_item.unit_price,
                toppings=c_item.toppings
            )
            db.add(o_item)
            await db.delete(c_item)

        # 6. Commit transaction atomically
        await db.commit()

        # Re-fetch order with items and products loaded cleanly for response
        fetch_stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.product))
            .where(Order.id == new_order.id)
        )
        refresh_result = await db.execute(fetch_stmt)
        complete_order = refresh_result.scalar_one()
        return complete_order

    except HTTPException as http_ex:
        await db.rollback()
        raise http_ex
    except Exception as ex:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi hệ thống khi tạo đơn hàng: {str(ex)}"
        )

@router.get("/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get order history for current logged-in user.
    """
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return orders

@router.get("", response_model=List[OrderResponse])
async def get_all_orders(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Get all orders in the system.
    """
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(stmt)
    orders = result.scalars().all()
    return orders

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Update order status (pending -> confirmed -> shipping -> completed / cancelled).
    """
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đơn hàng không tồn tại."
        )

    valid_statuses = ["pending", "confirmed", "shipping", "completed", "cancelled"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trạng thái không hợp lệ. Các trạng thái hợp lệ: {', '.join(valid_statuses)}"
        )

    order.status = payload.status
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order
