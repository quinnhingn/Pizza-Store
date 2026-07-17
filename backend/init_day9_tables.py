import asyncio
from sqlalchemy import text
from app.core.database import engine

async def create_tables():
    async with engine.begin() as conn:
        print("Creating sizes and toppings master tables and product association tables...")
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS toppings (
                id                  SERIAL PRIMARY KEY,
                name                VARCHAR(100) UNIQUE NOT NULL,
                default_extra_price DECIMAL(10,2) DEFAULT 0
            );
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_toppings (
                id              SERIAL PRIMARY KEY,
                product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                topping_name    VARCHAR(100) NOT NULL,
                extra_price     DECIMAL(10,2) DEFAULT 0
            );
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS sizes (
                id                          SERIAL PRIMARY KEY,
                name                        VARCHAR(50) UNIQUE NOT NULL,
                default_price_multiplier    DECIMAL(3,2) DEFAULT 1.0,
                default_extra_price         DECIMAL(10,2) DEFAULT 0
            );
        """))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS product_sizes (
                id                  SERIAL PRIMARY KEY,
                product_id          INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                size_name           VARCHAR(20) NOT NULL,
                price_multiplier    DECIMAL(3,2) DEFAULT 1.0,
                extra_price         DECIMAL(10,2) DEFAULT 0
            );
        """))
        print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())
