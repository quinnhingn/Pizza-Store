from datetime import datetime, timezone, timedelta
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
from app.models.user_notification import UserNotification
from app.models.user_voucher import UserVoucher
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.api.ws import manager

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

            # Check one-time usage per user
            chk_used = await db.execute(
                select(Order).where(
                    Order.user_id == current_user.id,
                    Order.voucher_code == voucher.code
                )
            )
            if chk_used.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Bạn đã sử dụng mã giảm giá này rồi. Mỗi mã chỉ áp dụng 1 lần cho 1 khách hàng."
                )

            VN_TZ = timezone(timedelta(hours=7))
            now = datetime.now(VN_TZ)
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

            # Find UserVoucher and mark as used
            uv_stmt = select(UserVoucher).where(
                UserVoucher.user_id == current_user.id,
                UserVoucher.voucher_code == voucher.code
            )
            uv_result = await db.execute(uv_stmt)
            user_voucher = uv_result.scalar_one_or_none()
            if user_voucher:
                user_voucher.is_used = True
                db.add(user_voucher)

        # 3. Calculate shipping fee and final total
        shipping_fee = Decimal("0.00") if subtotal >= Decimal("200000.00") else Decimal("25000.00")
        total_amount = subtotal - discount_amount + shipping_fee
        if total_amount < Decimal("0.00"):
            total_amount = Decimal("0.00")

        VN_TZ = timezone(timedelta(hours=7))
        order_code = f"ORD-{int(datetime.now(VN_TZ).timestamp())}-{current_user.id}"
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

        # 5.1 Create notifications for all admins
        admin_stmt = select(User).where(User.role == "admin", User.is_active == True)
        admin_res = await db.execute(admin_stmt)
        admins = admin_res.scalars().all()
        for adm in admins:
            notif = UserNotification(
                user_id=adm.id,
                title="Đơn đặt hàng mới",
                message=f"Đơn hàng mới {order_code} trị giá {total_amount:,.0f}đ vừa được đặt bởi {payload.shipping_full_name} ({payload.shipping_phone}).",
                type="new_order",
                reference_code=order_code
            )
            db.add(notif)

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
        
        # Broadcast WebSocket event to admins
        await manager.broadcast_to_admins({
            "type": "new_order",
            "message": f"Đơn hàng mới {order_code} vừa được đặt.",
            "order_id": complete_order.id
        })
        
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
    orders = list(result.scalars().all())

    if orders:
        from app.models.review import Review
        order_ids = [o.id for o in orders]
        review_stmt = select(Review.order_id).where(Review.order_id.in_(order_ids))
        review_result = await db.execute(review_stmt)
        reviewed_order_ids = set(review_result.scalars().all())
        
        for order in orders:
            order.has_reviews = order.id in reviewed_order_ids

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

    valid_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["shipping", "cancelled"],
        "shipping": ["completed", "cancelled"],
        "completed": [],
        "cancelled": []
    }

    if order.status in ["cancelled", "completed"] and payload.status != order.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn hàng đã kết thúc (Hoàn thành hoặc Đã hủy), không thể chuyển trạng thái."
        )

    allowed_next = valid_transitions.get(order.status, [])
    if payload.status not in allowed_next and payload.status != order.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Trạng thái '{payload.status}' không hợp lệ từ trạng thái hiện tại '{order.status}'. Chỉ có thể chuyển sang: {', '.join(allowed_next)}"
        )

    if payload.status == "completed" and not order.customer_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chưa thể hoàn thành đơn hàng: Khách hàng chưa bấm xác nhận Đã nhận hàng."
        )

    order.status = payload.status
    db.add(order)

    # Nếu chuyển sang 'shipping', thông báo cho Customer
    if payload.status == "shipping":
        notif = UserNotification(
            user_id=order.user_id,
            title="Đơn hàng đang được giao",
            message=f"Đơn hàng {order.order_code} của bạn đang được shipper vận chuyển đến địa chỉ đã đặt. Vui lòng chuẩn bị nhận hàng!",
            type="order_shipping",
            reference_code=order.order_code
        )
        db.add(notif)

    await db.commit()
    await db.refresh(order)
    
    status_messages = {
        "confirmed": f"Đơn hàng {order.order_code} đã được quán xác nhận.",
        "shipping": f"Đơn hàng {order.order_code} đang trên đường giao đến bạn!",
        "completed": f"Đơn hàng {order.order_code} đã được giao thành công.",
        "cancelled": f"Đơn hàng {order.order_code} đã bị hủy."
    }

    # Broadcast status update
    event_data = {
        "type": "order_update",
        "message": status_messages.get(payload.status, f"Đơn hàng {order.order_code} đã được cập nhật trạng thái."),
        "order_id": order.id,
        "status": payload.status
    }
    await manager.send_personal_message(event_data, order.user_id)
    await manager.broadcast_to_admins(event_data)
    
    return order

@router.put("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel an order. Only allowed when order status is 'pending'.
    Customer can only cancel their own orders. Admin can cancel any order in 'pending' state.
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

    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền hủy đơn hàng này."
        )

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn hàng đang trong quá trình xử lý hoặc đã hoàn thành, không thể hủy."
        )

    order.status = "cancelled"
    db.add(order)
    await db.commit()
    await db.refresh(order)
    
    # Broadcast cancellation
    event_data = {
        "type": "order_update",
        "message": f"Đơn hàng {order.order_code} đã bị hủy.",
        "order_id": order.id,
        "status": "cancelled"
    }
    await manager.send_personal_message(event_data, order.user_id)
    await manager.broadcast_to_admins(event_data)
    
    return order

@router.put("/{order_id}/confirm-received", response_model=OrderResponse)
async def confirm_order_received(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer confirms they have received the order when status is 'shipping'.
    Sets customer_confirmed = True and sends notification to admins.
    """
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order or order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đơn hàng không tồn tại hoặc không thuộc tài khoản của bạn."
        )

    if order.status != "shipping":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Đơn hàng không ở trạng thái Đang giao hàng, không thể xác nhận nhận hàng."
        )

    order.customer_confirmed = True
    db.add(order)

    # Thông báo cho tất cả Admin biết khách đã nhận hàng
    admin_stmt = select(User).where(User.role == "admin", User.is_active == True)
    admin_res = await db.execute(admin_stmt)
    admins = admin_res.scalars().all()
    for adm in admins:
        notif = UserNotification(
            user_id=adm.id,
            title="Khách đã nhận hàng",
            message=f"Khách hàng {current_user.full_name or current_user.phone} đã xác nhận nhận thành công đơn hàng {order.order_code}.",
            type="order_received",
            reference_code=order.order_code
        )
        db.add(notif)

    await db.commit()
    await db.refresh(order)

    # Broadcast confirm received
    event_data = {
        "type": "order_update",
        "message": f"Khách hàng đã xác nhận nhận đơn hàng {order.order_code}.",
        "order_id": order.id,
        "status": order.status,
        "customer_confirmed": True
    }
    await manager.send_personal_message(event_data, order.user_id)
    await manager.broadcast_to_admins(event_data)

    return order
