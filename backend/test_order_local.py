import asyncio
import os
import traceback
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from dotenv import load_dotenv

from app.api.orders import create_order
from app.schemas.order import OrderCreate
from app.models.user import User
from app.models.product import Product

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def test_create_order():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Get a user
        res = await db.execute(select(User).limit(1))
        user = res.scalars().first()
        print(f"Testing with user: {user.email}")
        
        payload = OrderCreate(
            shipping_full_name="Test",
            shipping_phone="0123456789",
            shipping_address="Test Addr",
            shipping_address_id=None,
            note="Test note",
            voucher_code=None
        )
        
        # get a product
        res_p = await db.execute(select(Product).limit(1))
        product = res_p.scalars().first()
        
        try:
            # We must make sure cart has items for this user
            from app.models.cart import CartItem
            # insert a cart item manually
            test_item = CartItem(
                user_id=user.id,
                product_id=product.id,
                quantity=1,
                size_name="Size M",
                toppings=[],
                unit_price=100000,
                total_price=100000
            )
            db.add(test_item)
            await db.flush()
            
            # call create_order
            order = await create_order(payload=payload, db=db, current_user=user)
            print("Order created successfully:", order.id)
            await db.rollback() # don't actually save it
        except Exception as e:
            print("EXCEPTION CAUGHT:")
            traceback.print_exc()
            await db.rollback()
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_create_order())
