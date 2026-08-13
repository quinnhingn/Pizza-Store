from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone, timedelta
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.review import Review
from app.schemas.review import ReviewSubmitRequest, OrderReviewStatusResponse, ReviewStatusItem, ReviewResponse

router = APIRouter()

@router.get("/orders/{order_id}/review-status", response_model=OrderReviewStatusResponse)
async def get_order_review_status(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if order belongs to user
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    # Get order items
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    order_items = items_result.scalars().all()
    product_ids = list(set([item.product_id for item in order_items]))

    # Get existing reviews for this order
    reviews_result = await db.execute(
        select(Review).where(Review.order_id == order_id, Review.user_id == current_user.id)
    )
    existing_reviews = reviews_result.scalars().all()
    review_map = {r.product_id: r for r in existing_reviews}

    status_items = []
    for pid in product_ids:
        r = review_map.get(pid)
        status_items.append(
            ReviewStatusItem(
                product_id=pid,
                is_reviewed=r is not None,
                review=r
            )
        )
        
    return OrderReviewStatusResponse(order_id=order_id, items=status_items)


@router.post("/orders/{order_id}/reviews")
async def submit_order_reviews(
    order_id: int,
    payload: ReviewSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check order
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        
    if order.status not in ["completed", "delivered"]:
        raise HTTPException(status_code=400, detail="Chỉ đơn hàng đã hoàn thành mới được đánh giá")
        
    # Check time limit (7 days)
    # Note: Using order.updated_at as completion time
    if order.updated_at:
        # Check if updated_at is naive or aware
        if order.updated_at.tzinfo is None:
            updated_at_aware = order.updated_at.replace(tzinfo=timezone.utc)
        else:
            updated_at_aware = order.updated_at
            
        now_aware = datetime.now(timezone.utc)
        if (now_aware - updated_at_aware) > timedelta(days=7):
            raise HTTPException(status_code=400, detail="Đã quá 7 ngày kể từ khi hoàn thành đơn hàng, không thể đánh giá")

    # Get valid product_ids from this order
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    order_items = items_result.scalars().all()
    valid_product_ids = set([item.product_id for item in order_items])

    # Get existing reviews to avoid duplicates
    reviews_result = await db.execute(
        select(Review).where(Review.order_id == order_id, Review.user_id == current_user.id)
    )
    existing_product_ids = set([r.product_id for r in reviews_result.scalars().all()])

    new_reviews = []
    for item in payload.reviews:
        if item.product_id not in valid_product_ids:
            continue # Skip invalid products
        if item.product_id in existing_product_ids:
            continue # Already reviewed
            
        new_review = Review(
            user_id=current_user.id,
            product_id=item.product_id,
            order_id=order_id,
            rating=item.rating,
            comment=item.comment,
            image_url=item.image_url
        )
        db.add(new_review)
        new_reviews.append(new_review)
        
    if not new_reviews:
        raise HTTPException(status_code=400, detail="Không có đánh giá hợp lệ nào được gửi")
        
    # Get all admin users to notify
    from app.models.user import User
    from app.models.user_notification import UserNotification
    from app.api.ws import manager
    
    admins_result = await db.execute(select(User).where(User.role == 'admin'))
    admins = admins_result.scalars().all()
    
    for adm in admins:
        notif = UserNotification(
            user_id=adm.id,
            title="Đánh giá mới",
            message=f"Có đánh giá mới cho đơn hàng {order.order_code}.",
            type="new_review",
            reference_code=str(order.id)
        )
        db.add(notif)
        
    await db.commit()
    
    # Broadcast to admins
    await manager.broadcast_to_admins({
        "type": "new_review",
        "message": f"Có đánh giá mới cho đơn hàng {order.order_code}.",
        "order_id": order.id
    })
    
    return {"message": "Đánh giá thành công", "count": len(new_reviews)}
