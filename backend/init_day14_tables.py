import asyncio
from sqlalchemy import text
from app.core.database import engine, Base
import app.models  # Import all models to register with Base.metadata

async def create_cart_tables():
    async with engine.begin() as conn:
        print("Dropping old cart_items table if exists and re-creating with latest schema...")
        await conn.execute(text("DROP TABLE IF EXISTS cart_items CASCADE"))
        await conn.run_sync(Base.metadata.create_all)
        print("Table cart_items created successfully!")

if __name__ == "__main__":
    asyncio.run(create_cart_tables())
