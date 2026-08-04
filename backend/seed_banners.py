import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.banner import Banner
from app.core.database import Base

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://neondb_owner:n81RKVQhMcsx@ep-black-water-a17p7i7d.ap-southeast-1.aws.neon.tech/neondb?ssl=require")

async def seed_banners():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if already has banners
        # Create some sample banners
        b1 = Banner(
            title="Thứ 3 Mua 1 Tặng 1",
            description="Tặng ngay 1 Pizza cỡ vừa khi mua 1 Pizza cỡ lớn.",
            image_url="https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop",
            link_url="/products/1",
            display_order=1
        )
        b2 = Banner(
            title="Combo Sinh Viên Giá Rẻ",
            description="Combo hấp dẫn chỉ từ 199K",
            image_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop",
            display_order=2
        )
        
        session.add_all([b1, b2])
        await session.commit()
        print("Seeded 2 sample banners!")

if __name__ == "__main__":
    asyncio.run(seed_banners())
