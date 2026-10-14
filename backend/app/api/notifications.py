from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.user_notification import UserNotification
from app.models.user_voucher import UserVoucher
from app.schemas.user_notification import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy toàn bộ thông báo của người dùng đang đăng nhập, sắp xếp theo mới nhất trước.
    """
    stmt = select(UserNotification).where(
        UserNotification.user_id == current_user.id
    ).order_by(UserNotification.id.desc())
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    return notifications

@router.patch("/{id}/read", status_code=status.HTTP_200_OK)
async def mark_notification_read(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Đánh dấu một thông báo cụ thể là đã đọc.
    """
    notif = await db.get(UserNotification, id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo.")

    notif.is_read = True
    await db.commit()
    return {"message": "Đã đánh dấu đã đọc."}

@router.patch("/read-all", status_code=status.HTTP_200_OK)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Đánh dấu tất cả thông báo chưa đọc của người dùng hiện tại là đã đọc.
    """
    stmt = update(UserNotification).where(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False
    ).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Đã đánh dấu đã đọc tất cả thông báo."}

@router.delete("/clear-all", status_code=status.HTTP_200_OK)
async def clear_all_notifications(
    type: str = "general",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Xóa tất cả thông báo đã đọc của người dùng hiện tại.
    Nếu type == 'voucher': chỉ xóa thông báo voucher_gift.
    Ngược lại: xóa tất cả thông báo khác (không phải voucher_gift).
    """
    from sqlalchemy import delete
    
    # Điều kiện chung: thuộc user hiện tại và đã được đọc
    conditions = [
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == True
    ]
    
    # Phân loại loại thông báo cần xóa
    if type == "voucher":
        conditions.append(UserNotification.type == "voucher_gift")
    else:
        conditions.append(UserNotification.type != "voucher_gift")
        
    stmt = delete(UserNotification).where(*conditions)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Đã xóa tất cả thông báo đã đọc."}
