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
    """
    Kiểm tra trạng thái đánh giá của từng sản phẩm trong một đơn hàng.
    Trả về danh sách sản phẩm cùng thông tin đã đánh giá hay chưa, dùng để hiển thị form review.
    """
    # Kiểm tra đơn hàng thuộc về người dùng hiện tại
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    # Lấy danh sách sản phẩm trong đơn hàng
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    order_items = items_result.scalars().all()
    # Dùng set để loại trùng (một sản phẩm có thể xuất hiện nhiều lần với size/topping khác nhau)
    product_ids = list(set([item.product_id for item in order_items]))

    # Lấy các review hiện có của người dùng cho đơn hàng này
    reviews_result = await db.execute(
        select(Review).where(Review.order_id == order_id, Review.user_id == current_user.id)
    )
    existing_reviews = reviews_result.scalars().all()
    # Tạo map product_id -> review để tra cứu nhanh
    review_map = {r.product_id: r for r in existing_reviews}

    # Xây dựng danh sách trạng thái review cho từng sản phẩm
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
    """
    Khách hàng gửi đánh giá cho các sản phẩm trong đơn hàng đã hoàn thành.
    Điều kiện: Đơn phải ở trạng thái 'completed', chưa quá 7 ngày, và sản phẩm phải thuộc đơn hàng đó.
    """
    # Kiểm tra đơn hàng tồn tại và thuộc về người dùng hiện tại
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == current_user.id))
    order = result.unique().scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        
    # Chỉ cho phép đánh giá đơn hàng đã hoàn thành
    if order.status not in ["completed", "delivered"]:
        raise HTTPException(status_code=400, detail="Chỉ đơn hàng đã hoàn thành mới được đánh giá")
        
    # Kiểm tra giới hạn thời gian đánh giá: tối đa 7 ngày kể từ khi hoàn thành
    # Dùng updated_at làm mốc thời gian hoàn thành đơn
    if order.updated_at:
        # Xử lý trường hợp updated_at có hoặc không có timezone info
        if order.updated_at.tzinfo is None:
            updated_at_aware = order.updated_at.replace(tzinfo=timezone.utc)
        else:
            updated_at_aware = order.updated_at
            
        now_aware = datetime.now(timezone.utc)
        if (now_aware - updated_at_aware) > timedelta(days=7):
            raise HTTPException(status_code=400, detail="Đã quá 7 ngày kể từ khi hoàn thành đơn hàng, không thể đánh giá")

    # Lấy danh sách product_id hợp lệ từ đơn hàng (chỉ cho phép đánh giá sản phẩm trong đơn)
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    order_items = items_result.scalars().all()
    valid_product_ids = set([item.product_id for item in order_items])

    # Lấy danh sách sản phẩm đã được đánh giá để tránh tạo review trùng
    reviews_result = await db.execute(
        select(Review).where(Review.order_id == order_id, Review.user_id == current_user.id)
    )
    existing_product_ids = set([r.product_id for r in reviews_result.scalars().all()])

    # Tạo review mới cho từng sản phẩm hợp lệ, bỏ qua sản phẩm không thuộc đơn hoặc đã review
    new_reviews = []
    for item in payload.reviews:
        if item.product_id not in valid_product_ids:
            continue  # Bỏ qua sản phẩm không thuộc đơn hàng này
        if item.product_id in existing_product_ids:
            continue  # Bỏ qua sản phẩm đã được đánh giá trước đó
            
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
        
    # Gửi thông báo đến tất cả Admin về review mới
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
    
    # Broadcast sự kiện WebSocket báo có review mới cho Admin đang online
    await manager.broadcast_to_admins({
        "type": "new_review",
        "message": f"Có đánh giá mới cho đơn hàng {order.order_code}.",
        "order_id": order.id
    })
    
    return {"message": "Đánh giá thành công", "count": len(new_reviews)}
