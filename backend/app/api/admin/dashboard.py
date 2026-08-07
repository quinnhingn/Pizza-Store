from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional, Dict

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product

router = APIRouter()

def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

class RecentOrder(BaseModel):
    id: int
    order_code: str
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime

class TodayStatsResponse(BaseModel):
    revenue_today: float
    orders_today: int
    pending_orders: int
    new_customers_today: int
    recent_orders: List[RecentOrder]

class ChartData(BaseModel):
    date: str
    revenue: float

class TopProduct(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    total_sold: int
    revenue: float

class AnalyticsResponse(BaseModel):
    total_revenue: float
    total_orders: int
    avg_order_value: float
    completion_rate: float
    revenue_chart: List[ChartData]
    top_products: List[TopProduct]
    status_distribution: Dict[str, int]


@router.get("/today", response_model=TodayStatsResponse)
async def get_today_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    VN_TZ = timezone(timedelta(hours=7))
    now = datetime.now(VN_TZ)
    start_of_today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Doanh thu hôm nay
    rev_stmt = select(func.sum(Order.total_amount)).where(
        Order.status == 'completed',
        Order.created_at >= start_of_today
    )
    revenue_today = float((await db.execute(rev_stmt)).scalar() or 0)

    # Đơn mới hôm nay (tất cả trạng thái)
    ord_stmt = select(func.count(Order.id)).where(Order.created_at >= start_of_today)
    orders_today = (await db.execute(ord_stmt)).scalar() or 0

    # Khách hàng mới hôm nay
    start_of_today_naive = start_of_today.replace(tzinfo=None)
    cust_stmt = select(func.count(User.id)).where(
        User.role == 'customer',
        User.created_at >= start_of_today_naive
    )
    new_customers_today = (await db.execute(cust_stmt)).scalar() or 0

    # Đơn đang chờ xử lý (không tính theo ngày, vì có thể từ hôm qua)
    pend_stmt = select(func.count(Order.id)).where(Order.status == 'pending')
    pending_orders = (await db.execute(pend_stmt)).scalar() or 0

    # Danh sách đơn hàng cần chú ý (Mới nhất, trạng thái pending/confirmed/shipping)
    recent_stmt = (
        select(Order)
        .where(Order.status.in_(['pending', 'confirmed', 'shipping']))
        .order_by(desc(Order.created_at))
        .limit(10)
    )
    recent_rows = (await db.execute(recent_stmt)).unique().scalars().all()
    recent_orders = [
        RecentOrder(
            id=row.id,
            order_code=row.order_code,
            customer_name=row.shipping_full_name,
            total_amount=float(row.total_amount),
            status=row.status,
            created_at=row.created_at
        ) for row in recent_rows
    ]

    return TodayStatsResponse(
        revenue_today=revenue_today,
        orders_today=orders_today,
        pending_orders=pending_orders,
        new_customers_today=new_customers_today,
        recent_orders=recent_orders
    )


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    start_date: str = Query(..., description="ISO date string"),
    end_date: str = Query(..., description="ISO date string"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).replace(tzinfo=None)
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).replace(tzinfo=None)

    # Tổng quan
    rev_stmt = select(func.sum(Order.total_amount)).where(
        Order.status == 'completed', 
        Order.created_at >= start, 
        Order.created_at <= end
    )
    total_revenue = float((await db.execute(rev_stmt)).scalar() or 0)

    ord_stmt = select(func.count(Order.id)).where(Order.created_at >= start, Order.created_at <= end)
    total_orders = (await db.execute(ord_stmt)).scalar() or 0

    avg_order_value = 0.0
    completed_stmt = select(func.count(Order.id)).where(
        Order.status == 'completed', 
        Order.created_at >= start, 
        Order.created_at <= end
    )
    completed_orders = (await db.execute(completed_stmt)).scalar() or 0
    if completed_orders > 0:
        avg_order_value = total_revenue / completed_orders

    completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0.0

    # Phân bổ trạng thái
    status_stmt = select(Order.status, func.count(Order.id)).where(
        Order.created_at >= start, 
        Order.created_at <= end
    ).group_by(Order.status)
    status_rows = (await db.execute(status_stmt)).all()
    status_distribution = {row[0]: row[1] for row in status_rows}

    # Top products
    top_prod_stmt = (
        select(
            Product.id,
            Product.name,
            Product.image_url,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue")
        )
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status == 'completed', Order.created_at >= start, Order.created_at <= end)
        .group_by(Product.id)
        .order_by(desc("total_sold"))
        .limit(5)
    )
    top_prod_rows = (await db.execute(top_prod_stmt)).all()
    top_products = [
        TopProduct(
            id=row.id,
            name=row.name,
            image_url=row.image_url,
            total_sold=row.total_sold or 0,
            revenue=float(row.revenue or 0)
        ) for row in top_prod_rows
    ]

    # Revenue chart (theo ngày)
    chart_stmt = (
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("daily_revenue")
        )
        .where(Order.status == 'completed', Order.created_at >= start, Order.created_at <= end)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    chart_rows = (await db.execute(chart_stmt)).all()
    revenue_chart = [
        ChartData(
            date=str(row.date),
            revenue=float(row.daily_revenue)
        ) for row in chart_rows
    ]

    return AnalyticsResponse(
        total_revenue=total_revenue,
        total_orders=total_orders,
        avg_order_value=avg_order_value,
        completion_rate=completion_rate,
        revenue_chart=revenue_chart,
        top_products=top_products,
        status_distribution=status_distribution
    )
