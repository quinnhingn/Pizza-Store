import asyncio
import websockets
import json
import requests

from app.core.security import create_access_token
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy.future import select

async def get_user_token(email: str):
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalar_one_or_none()
        if not user: return None
        return create_access_token(subject=str(user.id))

async def main():
    admin_token = await get_user_token("admin_day6@pizzastore.com")
    customer_token = await get_user_token("thnam@gmail.com")

    if not admin_token or not customer_token:
        print("Could not find users")
        return

    admin_ws_url = f"ws://localhost:8000/api/ws?token={admin_token}"
    customer_ws_url = f"ws://localhost:8000/api/ws?token={customer_token}"

    async def connect_and_listen(url, role):
        try:
            async with websockets.connect(url) as ws:
                print(f"[{role}] Connected!")
                
                # Send API request to trigger broadcast
                if role == "ADMIN":
                    await asyncio.sleep(1) # wait for connection
                    print("Sending API request to update order 31...")
                    r = requests.put(
                        "http://localhost:8000/api/orders/31/status",
                        json={"status": "confirmed"},
                        headers={"Authorization": f"Bearer {admin_token}"}
                    )
                    print("API Response:", r.status_code, r.text)

                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=10.0)
                    print(f"[{role}] Received message: {msg}")
        except asyncio.TimeoutError:
            print(f"[{role}] No message in 10s, stopping.")
        except Exception as e:
            print(f"[{role}] Error:", type(e), e)

    await asyncio.gather(
        connect_and_listen(admin_ws_url, "ADMIN"),
        connect_and_listen(customer_ws_url, "CUSTOMER")
    )

if __name__ == "__main__":
    asyncio.run(main())
