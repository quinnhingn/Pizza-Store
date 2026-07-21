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
    Get all notifications for the logged-in customer, ordered by newest first.
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
    Mark a single notification as read.
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
    Mark all unread notifications as read for current user.
    """
    stmt = update(UserNotification).where(
        UserNotification.user_id == current_user.id,
        UserNotification.is_read == False
    ).values(is_read=True)
    await db.execute(stmt)
    await db.commit()
    return {"message": "Đã đánh dấu đã đọc tất cả thông báo."}
