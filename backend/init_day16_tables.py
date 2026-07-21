import asyncio
import sys
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select, text
from app.core.database import engine, AsyncSessionLocal, Base
import app.models
from app.models.voucher import Voucher

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

VOUCHERS_SEED = [
    {
        "code": "WELCOME50",
        "discount_percent": None,
        "discount_amount": Decimal("50000.00"),
        "max_discount": None,
        "min_order_value": Decimal("200000.00"),
        "start_date": datetime(2026, 1, 1, 0, 0, 0),
        "end_date": datetime(2027, 12, 31, 23, 59, 59),
        "usage_limit": 1000,
        "used_count": 0,
        "is_active": True,
    },
    {
        "code": "PIZZA10",
        "discount_percent": 10,
        "discount_amount": None,
        "max_discount": Decimal("50000.00"),
        "min_order_value": Decimal("150000.00"),
        "start_date": datetime(2026, 1, 1, 0, 0, 0),
        "end_date": datetime(2027, 12, 31, 23, 59, 59),
        "usage_limit": 500,
        "used_count": 0,
        "is_active": True,
    },
    {
        "code": "FREESHIP25",
        "discount_percent": None,
        "discount_amount": Decimal("25000.00"),
        "max_discount": None,
        "min_order_value": Decimal("100000.00"),
        "start_date": datetime(2026, 1, 1, 0, 0, 0),
        "end_date": datetime(2027, 12, 31, 23, 59, 59),
        "usage_limit": 2000,
        "used_count": 0,
        "is_active": True,
    },
    {
        "code": "EXPIRED",
        "discount_percent": None,
        "discount_amount": Decimal("30000.00"),
        "max_discount": None,
        "min_order_value": Decimal("100000.00"),
        "start_date": datetime(2025, 1, 1, 0, 0, 0),
        "end_date": datetime(2025, 12, 31, 23, 59, 59),
        "usage_limit": 100,
        "used_count": 100,
        "is_active": False,
    },
]

async def init_and_seed_vouchers():
    async with engine.begin() as conn:
        print("Creating table vouchers if not exists...")
        await conn.run_sync(Base.metadata.create_all)
        print("Table vouchers verified successfully!")

    async with AsyncSessionLocal() as session:
        for item in VOUCHERS_SEED:
            stmt = select(Voucher).where(Voucher.code == item["code"])
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            if not existing:
                print(f"-> Seeding voucher code: {item['code']}...")
                new_voucher = Voucher(**item)
                session.add(new_voucher)
            else:
                print(f"-> Voucher {item['code']} already exists. Skipping.")
        await session.commit()
    print("Vouchers seeding completed successfully!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_and_seed_vouchers())
