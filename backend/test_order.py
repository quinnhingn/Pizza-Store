import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Login to get token
        login_res = await client.post("http://127.0.0.1:8000/api/auth/login", json={
            "email": "customer_day4@example.com",
            "password": "password123"
        })
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add an item to cart (assuming product 1 exists)
        add_res = await client.post("http://127.0.0.1:8000/api/cart/", json={
            "product_id": 1,
            "quantity": 1,
            "size_name": "Size M",
            "toppings": []
        }, headers=headers)
        if add_res.status_code != 200:
            print("Add to cart failed:", add_res.text)
            return

        # 3. Create order
        order_res = await client.post("http://127.0.0.1:8000/api/orders", json={
            "shipping_full_name": "Test User",
            "shipping_phone": "0987654321",
            "shipping_address": "123 Test St",
            "shipping_address_id": None,
            "note": "Test order",
            "voucher_code": None
        }, headers=headers)
        
        print("Create order response:", order_res.status_code)
        print(order_res.text)

if __name__ == "__main__":
    asyncio.run(main())
