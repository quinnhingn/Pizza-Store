from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, case, text, desc, and_
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.product import Product

router = APIRouter()

def require_admin(user: User = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

class ChartData(BaseModel):
    date: str
    revenue: float

class TopProduct(BaseModel):
    id: int
    name: str
    image_url: Optional[str]
    total_sold: int
    revenue: float

class RecentOrder(BaseModel):
    id: int
    order_code: str
    customer_name: str
    total_amount: float
    status: str
    created_at: datetime

class DashboardResponse(BaseModel):
    total_revenue: float
    revenue_trend: float
    total_orders: int
    orders_trend: float
    active_orders: int
    total_customers: int
    customers_trend: float
    revenue_chart: List[ChartData]
    top_products: List[TopProduct]
    recent_orders: List[RecentOrder]

def calculate_trend(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)

@router.get("/", response_model=DashboardResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    today = datetime.now()
    seven_days_ago = today - timedelta(days=6)
    fourteen_days_ago = today - timedelta(days=13)

    # Helper function to get aggregate stats for a date range
    async def get_stats_for_period(start_date, end_date):
        # Revenue
        rev_stmt = select(func.sum(Order.total_amount)).where(
            Order.status == 'completed',
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
        rev_result = await db.execute(rev_stmt)
        revenue = float(rev_result.scalar() or 0)

        # Orders
        ord_stmt = select(func.count(Order.id)).where(
            Order.created_at >= start_date,
            Order.created_at <= end_date
        )
        ord_result = await db.execute(ord_stmt)
        orders = ord_result.scalar() or 0

        # Customers
        cust_stmt = select(func.count(User.id)).where(
            User.role == 'customer',
            User.created_at >= start_date,
            User.created_at <= end_date
        )
        cust_result = await db.execute(cust_stmt)
        customers = cust_result.scalar() or 0

        return revenue, orders, customers

    # Current period (Last 7 days for trend, but total stats are all-time except for trend comparison)
    # Wait, the UI usually shows Total Revenue of all time, or just this month?
    # Based on reference UI, "Total Orders", "Total Revenue" usually means "Lifetime" or "This Month".
    # Let's make the main metrics "Lifetime" and trend based on "Last 7 days vs Previous 7 days".
    
    # 1. Lifetime Totals
    rev_stmt_all = select(func.sum(Order.total_amount)).where(Order.status == 'completed')
    total_revenue = float((await db.execute(rev_stmt_all)).scalar() or 0)

    ord_stmt_all = select(func.count(Order.id))
    total_orders = (await db.execute(ord_stmt_all)).scalar() or 0

    cust_stmt_all = select(func.count(User.id)).where(User.role == 'customer')
    total_customers = (await db.execute(cust_stmt_all)).scalar() or 0

    # 2. Active Orders
    active_ord_stmt = select(func.count(Order.id)).where(Order.status.in_(['pending', 'processing', 'shipping']))
    active_orders = (await db.execute(active_ord_stmt)).scalar() or 0

    # 3. Trends (Last 7 days vs Previous 7 days)
    curr_rev, curr_ord, curr_cust = await get_stats_for_period(seven_days_ago, today)
    prev_rev, prev_ord, prev_cust = await get_stats_for_period(fourteen_days_ago, seven_days_ago)

    revenue_trend = calculate_trend(curr_rev, prev_rev)
    orders_trend = calculate_trend(curr_ord, prev_ord)
    customers_trend = calculate_trend(curr_cust, prev_cust)

    # 4. Revenue Chart (Last 7 days)
    chart_stmt = (
        select(
            func.date(Order.created_at).label("date"),
            func.sum(Order.total_amount).label("daily_revenue")
        )
        .where(Order.status == 'completed', Order.created_at >= seven_days_ago)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    chart_result = await db.execute(chart_stmt)
    chart_rows = chart_result.all()
    
    revenue_dict = {str(row.date): float(row.daily_revenue) for row in chart_rows}
    revenue_chart = []
    for i in range(7):
        current_date = (seven_days_ago + timedelta(days=i)).date()
        date_str = str(current_date)
        revenue_chart.append(ChartData(
            date=current_date.strftime("%d/%m"),
            revenue=revenue_dict.get(date_str, 0)
        ))

    # 5. Top 5 Products
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
        .where(Order.status == 'completed')
        .group_by(Product.id)
        .order_by(desc("total_sold"))
        .limit(5)
    )
    
    top_prod_result = await db.execute(top_prod_stmt)
    top_prod_rows = top_prod_result.all()
    top_products = [
        TopProduct(
            id=row.id,
            name=row.name,
            image_url=row.image_url,
            total_sold=row.total_sold or 0,
            revenue=float(row.revenue or 0)
        ) for row in top_prod_rows
    ]

    # 6. Recent Orders (Last 5)
    recent_stmt = (
        select(
            Order.id,
            Order.order_code,
            Order.shipping_full_name,
            Order.total_amount,
            Order.status,
            Order.created_at
        )
        .order_by(desc(Order.created_at))
        .limit(5)
    )
    recent_result = await db.execute(recent_stmt)
    recent_rows = recent_result.all()
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

    return DashboardResponse(
        total_revenue=total_revenue,
        revenue_trend=revenue_trend,
        total_orders=total_orders,
        orders_trend=orders_trend,
        active_orders=active_orders,
        total_customers=total_customers,
        customers_trend=customers_trend,
        revenue_chart=revenue_chart,
        top_products=top_products,
        recent_orders=recent_orders
    )
