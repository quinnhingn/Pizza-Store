from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, delete

from app.core.deps import get_db, get_current_admin_user, get_current_user
from app.models.voucher import Voucher
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_voucher import UserVoucher
from app.models.order import Order
from app.schemas.voucher import (
    VoucherCreate,
    VoucherUpdate,
    VoucherGiftRequest,
    VoucherResponse,
    VoucherValidateRequest,
    VoucherValidateResponse,
    SaveVoucherRequest,
    UserVoucherResponse,
)

router = APIRouter()

@router.post("/validate", response_model=VoucherValidateResponse)
async def validate_voucher(
    payload: VoucherValidateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Validate voucher code against current order value and return exact discount amount.
    """
    code_clean = payload.code.strip().upper()
    stmt = select(Voucher).where(Voucher.code == code_clean)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()

    if not voucher:
        return VoucherValidateResponse(
            valid=False,
            code=code_clean,
            discount_amount=0.0,
            message="Mã giảm giá không tồn tại."
        )

    if not voucher.is_active:
        return VoucherValidateResponse(
            valid=False,
            code=voucher.code,
            discount_amount=0.0,
            message="Mã giảm giá hiện không còn hoạt động."
        )

    now = datetime.now()
    if now < voucher.start_date or now > voucher.end_date:
        return VoucherValidateResponse(
            valid=False,
            code=voucher.code,
            discount_amount=0.0,
            message="Mã giảm giá chưa đến hạn hoặc đã hết hạn sử dụng."
        )

    if voucher.usage_limit is not None and voucher.used_count >= voucher.usage_limit:
        return VoucherValidateResponse(
            valid=False,
            code=voucher.code,
            discount_amount=0.0,
            message="Mã giảm giá đã hết lượt sử dụng."
        )

    order_val_dec = Decimal(str(payload.order_value))
    if voucher.min_order_value is not None:
        min_val_dec = Decimal(str(voucher.min_order_value))
        if order_val_dec < min_val_dec:
            formatted_min = f"{float(min_val_dec):,.0f}".replace(",", ".")
            return VoucherValidateResponse(
                valid=False,
                code=voucher.code,
                discount_amount=0.0,
                message=f"Đơn hàng cần đạt tối thiểu {formatted_min}đ để áp dụng mã này."
            )

    # Calculate discount
    discount = Decimal("0.00")
    if voucher.discount_percent is not None and voucher.discount_percent > 0:
        discount = (order_val_dec * Decimal(str(voucher.discount_percent))) / Decimal("100")
    elif voucher.discount_amount is not None and voucher.discount_amount > 0:
        discount = Decimal(str(voucher.discount_amount))

    if voucher.max_discount is not None and voucher.max_discount > 0:
        max_disc_dec = Decimal(str(voucher.max_discount))
        if discount > max_disc_dec:
            discount = max_disc_dec

    if discount > order_val_dec:
        discount = order_val_dec

    return VoucherValidateResponse(
        valid=True,
        code=voucher.code,
        discount_amount=float(discount),
        message="Áp dụng mã giảm giá thành công!",
        voucher_details=VoucherResponse.model_validate(voucher)
    )

@router.get("", response_model=List[VoucherResponse])
async def get_active_vouchers(db: AsyncSession = Depends(get_db)):
    """
    Get all active vouchers for user or general display.
    """
    stmt = select(Voucher).where(Voucher.is_active == True).order_by(Voucher.id.asc())
    result = await db.execute(stmt)
    vouchers = result.scalars().all()
    return vouchers

@router.get("/admin/all", response_model=List[VoucherResponse])
async def get_all_vouchers_admin(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Get all vouchers including inactive and expired.
    """
    stmt = select(Voucher).order_by(Voucher.id.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=VoucherResponse, status_code=status.HTTP_201_CREATED)
async def create_voucher(
    payload: VoucherCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Create a new voucher.
    """
    code_clean = payload.code.strip().upper()
    stmt = select(Voucher).where(Voucher.code == code_clean)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mã voucher này đã tồn tại."
        )

    voucher_data = payload.model_dump()
    voucher_data["code"] = code_clean
    if voucher_data.get("start_date") and getattr(voucher_data["start_date"], "tzinfo", None) is not None:
        voucher_data["start_date"] = voucher_data["start_date"].replace(tzinfo=None)
    if voucher_data.get("end_date") and getattr(voucher_data["end_date"], "tzinfo", None) is not None:
        voucher_data["end_date"] = voucher_data["end_date"].replace(tzinfo=None)
    new_voucher = Voucher(**voucher_data)
    try:
        db.add(new_voucher)
        await db.commit()
        await db.refresh(new_voucher)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể tạo voucher: {str(e)}"
        )
    return new_voucher

@router.put("/{id}", response_model=VoucherResponse)
async def update_voucher(
    id: int,
    payload: VoucherUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Update voucher details.
    """
    stmt = select(Voucher).where(Voucher.id == id)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")

    update_data = payload.model_dump(exclude_unset=True)
    if "code" in update_data and update_data["code"]:
        code_clean = update_data["code"].strip().upper()
        if code_clean != voucher.code:
            # Check unique
            chk = await db.execute(select(Voucher).where(Voucher.code == code_clean))
            if chk.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Mã voucher mới đã tồn tại.")
        update_data["code"] = code_clean

    if "start_date" in update_data and update_data["start_date"] and getattr(update_data["start_date"], "tzinfo", None) is not None:
        update_data["start_date"] = update_data["start_date"].replace(tzinfo=None)
    if "end_date" in update_data and update_data["end_date"] and getattr(update_data["end_date"], "tzinfo", None) is not None:
        update_data["end_date"] = update_data["end_date"].replace(tzinfo=None)

    for key, value in update_data.items():
        setattr(voucher, key, value)

    try:
        await db.commit()
        await db.refresh(voucher)
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể cập nhật voucher: {str(e)}"
        )
    return voucher

@router.patch("/{id}/status", response_model=VoucherResponse)
async def toggle_voucher_status(
    id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Toggle voucher is_active status.
    """
    stmt = select(Voucher).where(Voucher.id == id)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")

    voucher.is_active = not voucher.is_active
    await db.commit()
    await db.refresh(voucher)
    return voucher

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_voucher(
    id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Delete voucher. If used in orders or saved, soft-delete by deactivating.
    """
    stmt = select(Voucher).where(Voucher.id == id)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")

    # Check if used in orders or user_vouchers
    chk_order = await db.execute(select(Order).where(Order.voucher_code == voucher.code))
    chk_saved = await db.execute(select(UserVoucher).where(UserVoucher.voucher_code == voucher.code))
    
    if chk_order.scalar_one_or_none() or chk_saved.scalar_one_or_none():
        voucher.is_active = False
        await db.commit()
        return {"message": f"Mã {voucher.code} đã từng được áp dụng hoặc lưu trong ví khách hàng, hệ thống đã chuyển sang trạng thái ngưng hoạt động (Soft Delete) để bảo toàn dữ liệu."}

    await db.delete(voucher)
    await db.commit()
    return {"message": f"Đã xóa hoàn toàn mã voucher {voucher.code}."}

@router.post("/{id}/gift", status_code=status.HTTP_200_OK)
async def gift_voucher(
    id: int,
    payload: VoucherGiftRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """
    Admin only: Gift a voucher to specific users or all active customers via notifications.
    """
    stmt = select(Voucher).where(Voucher.id == id)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=404, detail="Không tìm thấy voucher.")

    if payload.send_to_all:
        users_stmt = select(User).where(User.is_active == True, User.role == "customer")
        users_result = await db.execute(users_stmt)
        target_users = users_result.scalars().all()
    else:
        if not payload.user_ids:
            raise HTTPException(status_code=400, detail="Vui lòng chọn ít nhất 1 khách hàng để tặng voucher.")
        users_stmt = select(User).where(User.id.in_(payload.user_ids), User.is_active == True)
        users_result = await db.execute(users_stmt)
        target_users = users_result.scalars().all()

    if not target_users:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng nào hợp lệ.")

    title = "Quà tặng ưu đãi từ Pizza Store!"
    message = payload.custom_message or f"Pizza Store gửi tặng bạn mã giảm giá đặc biệt {voucher.code}. Nhấn nút Lưu ngay bên dưới để sử dụng cho đơn hàng tiếp theo nhé!"

    notifications = []
    for u in target_users:
        notif = UserNotification(
            user_id=u.id,
            title=title,
            message=message,
            type="voucher_gift",
            reference_code=voucher.code
        )
        notifications.append(notif)

    db.add_all(notifications)
    await db.commit()

    return {"message": f"Đã gửi tặng mã {voucher.code} thành công đến {len(target_users)} khách hàng!"}

@router.post("/save", status_code=status.HTTP_200_OK)
async def save_voucher_to_wallet(
    payload: SaveVoucherRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer only: Save a gifted or public voucher code to personal wallet.
    """
    code_clean = payload.code.strip().upper()
    stmt = select(Voucher).where(Voucher.code == code_clean)
    result = await db.execute(stmt)
    voucher = result.scalar_one_or_none()
    if not voucher or not voucher.is_active:
        raise HTTPException(status_code=400, detail="Mã giảm giá không tồn tại hoặc đã ngưng hoạt động.")

    # Check if already saved
    chk = await db.execute(
        select(UserVoucher).where(UserVoucher.user_id == current_user.id, UserVoucher.voucher_code == code_clean)
    )
    if chk.scalar_one_or_none():
        # If notification_id provided, mark read as well
        if payload.notification_id:
            notif = await db.get(UserNotification, payload.notification_id)
            if notif and notif.user_id == current_user.id:
                notif.is_read = True
                await db.commit()
        raise HTTPException(status_code=400, detail="Bạn đã lưu mã ưu đãi này trong ví rồi.")

    new_saved = UserVoucher(
        user_id=current_user.id,
        voucher_code=code_clean,
        is_used=False
    )
    db.add(new_saved)

    if payload.notification_id:
        notif = await db.get(UserNotification, payload.notification_id)
        if notif and notif.user_id == current_user.id:
            notif.is_read = True

    await db.commit()
    return {"message": f"Đã lưu mã {code_clean} vào kho voucher của bạn!"}

@router.get("/my-saved-vouchers", response_model=List[UserVoucherResponse])
async def get_my_saved_vouchers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Customer only: Get all unused and valid saved vouchers in personal wallet.
    """
    stmt = select(UserVoucher).where(
        UserVoucher.user_id == current_user.id,
        UserVoucher.is_used == False
    ).order_by(UserVoucher.id.desc())
    result = await db.execute(stmt)
    saved_list = result.scalars().all()

    # Populate voucher details and filter out inactive
    valid_saved = []
    for item in saved_list:
        v_stmt = select(Voucher).where(Voucher.code == item.voucher_code)
        v_res = await db.execute(v_stmt)
        v_obj = v_res.scalar_one_or_none()
        if v_obj and v_obj.is_active:
            item.voucher_details = VoucherResponse.model_validate(v_obj)
            valid_saved.append(item)

    return valid_saved
