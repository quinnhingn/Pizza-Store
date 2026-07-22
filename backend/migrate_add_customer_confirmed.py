import asyncio
import os
import sys
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def migrate():
    if not DATABASE_URL:
        print("❌ Lỗi: Không tìm thấy DATABASE_URL")
        sys.exit(1)
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Migrating: ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT FALSE to orders table...")
        await conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_confirmed BOOLEAN DEFAULT FALSE;"))
        print("✅ Migration thành công!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(migrate())
