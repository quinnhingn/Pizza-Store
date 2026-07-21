import asyncio
import sys
from app.core.database import engine, Base
import app.models
from app.models.order import Order, OrderItem

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

async def init_orders_tables():
    async with engine.begin() as conn:
        print("Creating tables orders and order_items if not exist...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables orders and order_items verified successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_orders_tables())
