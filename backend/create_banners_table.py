import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.models.banner import Banner
from app.core.database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://neondb_owner:n81RKVQhMcsx@ep-black-water-a17p7i7d.ap-southeast-1.aws.neon.tech/neondb?ssl=require")

async def recreate_banners_table():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Dropping banners table if exists...")
        await conn.run_sync(Banner.__table__.drop, checkfirst=True)
        print("Creating banners table...")
        await conn.run_sync(Banner.__table__.create)
        print("Done.")

if __name__ == "__main__":
    asyncio.run(recreate_banners_table())
