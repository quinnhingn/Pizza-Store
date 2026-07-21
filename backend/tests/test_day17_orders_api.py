import sys
import pytest
import httpx
from httpx import ASGITransport
from sqlalchemy import delete
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.order import Order, OrderItem

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

@pytest.mark.asyncio
async def test_day17_orders_api():
    print("\n==========================================")
    print("STARTING DAY 17 ORDERS & CHECKOUT API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login user
        login_res = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Clear cart before testing checkout
        clear_res = await client.delete("/api/cart/clear", headers=headers)
        assert clear_res.status_code == 204

        # 3. Test create order when cart is empty -> Expect 400
        res_empty = await client.post("/api/orders", json={
            "shipping_full_name": "Nguyễn Văn A",
            "shipping_phone": "0901234567",
            "shipping_address": "123 Đường B, Quận C",
            "note": "Giao giờ hành chính"
        }, headers=headers)
        assert res_empty.status_code == 400
        assert "trống" in res_empty.json()["detail"]
        print("[OK] Create order with empty cart returned 400 correctly.")

        # 4. Create category and product to populate cart
        cats_res = await client.get("/api/categories")
        if cats_res.status_code == 200 and len(cats_res.json()) > 0:
            cat_id = cats_res.json()[0]["id"]
        else:
            cat_res = await client.post("/api/categories", json={
                "name": "Order Test Category",
                "description": "For day 17 testing"
            }, headers=headers)
            cat_id = cat_res.json()["id"]

        prod_res = await client.post("/api/products", json={
            "name": "Pizza Order Test Day 17",
            "description": "Pizza test checkout",
            "price": 250000,
            "category_id": cat_id,
            "is_available": True
        }, headers=headers)
        assert prod_res.status_code == 201
        prod_id = prod_res.json()["id"]

        # 5. Add product to cart (Qty: 1, Unit Price: 250,000 -> Subtotal: 250,000)
        add_res1 = await client.post("/api/cart/items", json={
            "product_id": prod_id,
            "size_name": "L",
            "quantity": 1,
            "unit_price": 250000,
            "toppings": [{"name": "Phô mai", "price": 25000}]
        }, headers=headers)
        assert add_res1.status_code == 201

        # 6. Create order WITHOUT voucher (Subtotal: 275,000 >= 200,000 -> Free ship -> Total: 275,000)
        order_res1 = await client.post("/api/orders", json={
            "shipping_full_name": "Nguyễn Văn A",
            "shipping_phone": "0901234567",
            "shipping_address": "123 Đường B, Quận C",
            "note": "Giao giờ hành chính"
        }, headers=headers)
        assert order_res1.status_code == 201, f"Create order failed: {order_res1.text}"
        order_data1 = order_res1.json()
        assert order_data1["order_code"].startswith("ORD-")
        assert order_data1["status"] == "pending"
        assert float(order_data1["discount_amount"]) == 0.0
        assert float(order_data1["total_amount"]) == 250000.0
        assert len(order_data1["items"]) == 1
        print(f"[OK] Order 1 created successfully: {order_data1['order_code']}")

        # Verify cart is empty after order creation
        cart_check1 = await client.get("/api/cart", headers=headers)
        assert cart_check1.json()["total_items"] == 0
        print("[OK] Cart verified empty after atomic checkout.")

        # 7. Add product to cart again for voucher checkout (Qty: 1, Unit Price: 250,000)
        add_res2 = await client.post("/api/cart/items", json={
            "product_id": prod_id,
            "size_name": "L",
            "quantity": 1,
            "unit_price": 250000,
            "toppings": []
        }, headers=headers)
        assert add_res2.status_code == 201

        # 8. Create order WITH valid voucher WELCOME50 (Subtotal 250,000 >= 200,000 -> -50,000 -> Total: 200,000)
        order_res2 = await client.post("/api/orders", json={
            "shipping_full_name": "Trần Thị B",
            "shipping_phone": "0987654321",
            "shipping_address": "456 Đường X, Quận Y",
            "voucher_code": "WELCOME50"
        }, headers=headers)
        assert order_res2.status_code == 201, f"Create voucher order failed: {order_res2.text}"
        order_data2 = order_res2.json()
        assert order_data2["voucher_code"] == "WELCOME50"
        assert float(order_data2["discount_amount"]) == 50000.0
        assert float(order_data2["total_amount"]) == 200000.0
        order2_id = order_data2["id"]
        print(f"[OK] Order 2 created with voucher WELCOME50 successfully: {order_data2['order_code']}")

        # 9. Test GET /api/orders/my-orders (User history)
        my_orders_res = await client.get("/api/orders/my-orders", headers=headers)
        assert my_orders_res.status_code == 200
        my_orders = my_orders_res.json()
        assert len(my_orders) >= 2
        print(f"[OK] GET /api/orders/my-orders returned {len(my_orders)} orders.")

        # 10. Test GET /api/orders (Admin all orders)
        all_orders_res = await client.get("/api/orders", headers=headers)
        assert all_orders_res.status_code == 200
        all_orders = all_orders_res.json()
        assert len(all_orders) >= 2
        print(f"[OK] Admin GET /api/orders returned {len(all_orders)} orders.")

        # 11. Test Admin status update PUT /api/orders/{id}/status
        update_status_res = await client.put(f"/api/orders/{order2_id}/status", json={
            "status": "confirmed"
        }, headers=headers)
        assert update_status_res.status_code == 200
        assert update_status_res.json()["status"] == "confirmed"
        print("[OK] Order status updated to 'confirmed' successfully.")

        # 12. Test Admin status update with invalid status -> Expect 400
        invalid_status_res = await client.put(f"/api/orders/{order2_id}/status", json={
            "status": "invalid_status"
        }, headers=headers)
        assert invalid_status_res.status_code == 400
        print("[OK] Invalid order status update rejected with 400 correctly.")

        # 13. Cleanup test orders and products from database so they do not show up on menu
        async with AsyncSessionLocal() as db:
            await db.execute(delete(OrderItem).where(OrderItem.order_id.in_([order_data1["id"], order2_id])))
            await db.execute(delete(Order).where(Order.id.in_([order_data1["id"], order2_id])))
            await db.commit()

        await client.delete(f"/api/products/{prod_id}", headers=headers)
        await client.delete(f"/api/categories/{cat_id}", headers=headers)
        print("[OK] Cleaned up test orders, products, and categories successfully.")

    print("==========================================")
    print("[SUCCESS] DAY 17 ORDERS API TESTS PASSED 100%!")
    print("==========================================")
