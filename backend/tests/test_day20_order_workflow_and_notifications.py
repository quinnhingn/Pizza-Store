import sys
import pytest
import httpx
from httpx import ASGITransport
from sqlalchemy import delete, select
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.order import Order, OrderItem
from app.models.user_notification import UserNotification

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

@pytest.mark.asyncio
async def test_day20_order_workflow_and_notifications():
    print("\n==========================================")
    print("STARTING DAY 20 ORDER WORKFLOW & NOTIFICATION API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login Admin
        admin_login = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Login Customer
        cust_login = await client.post("/api/auth/login", json={
            "email": "customer_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert cust_login.status_code == 200
        cust_token = cust_login.json()["data"]["access_token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}

        # Clear notifications for clean testing
        async with AsyncSessionLocal() as db:
            await db.execute(delete(UserNotification))
            await db.commit()

        # 3. Create test category and product
        cats_res = await client.get("/api/categories")
        if cats_res.status_code == 200 and len(cats_res.json()) > 0:
            cat_id = cats_res.json()[0]["id"]
        else:
            cat_res = await client.post("/api/categories", json={
                "name": "Workflow Test Category",
                "description": "For day 20 testing"
            }, headers=admin_headers)
            cat_id = cat_res.json()["id"]

        prod_res = await client.post("/api/products", json={
            "name": "Pizza Workflow Test",
            "description": "Test order workflow",
            "price": 150000,
            "category_id": cat_id,
            "is_available": True
        }, headers=admin_headers)
        assert prod_res.status_code == 201
        prod_id = prod_res.json()["id"]

        # 4. Customer adds product to cart and checks out
        await client.delete("/api/cart/clear", headers=cust_headers)
        await client.post("/api/cart/items", json={
            "product_id": prod_id,
            "quantity": 2,
            "unit_price": 150000
        }, headers=cust_headers)

        order_res = await client.post("/api/orders", json={
            "shipping_full_name": "Khách Test Workflow",
            "shipping_phone": "0911223344",
            "shipping_address": "789 Đường Test"
        }, headers=cust_headers)
        assert order_res.status_code == 201
        order_data = order_res.json()
        order_id = order_data["id"]
        order_code = order_data["order_code"]
        assert order_data["status"] == "pending"
        assert order_data["customer_confirmed"] == False
        print(f"[OK] Customer created order: {order_code}")

        # 5. Verify Admin received notification 'new_order'
        admin_notifs = await client.get("/api/notifications", headers=admin_headers)
        assert admin_notifs.status_code == 200
        notifs_list = admin_notifs.json()
        new_order_notifs = [n for n in notifs_list if n["type"] == "new_order" and n["reference_code"] == order_code]
        assert len(new_order_notifs) >= 1
        print("[OK] Admin received 'new_order' notification upon customer checkout.")

        # 6. Test cancel order when status == pending
        # Let's create another order to test cancel
        await client.post("/api/cart/items", json={
            "product_id": prod_id,
            "quantity": 1,
            "unit_price": 150000
        }, headers=cust_headers)
        cancel_order_res = await client.post("/api/orders", json={
            "shipping_full_name": "Khách Test Hủy",
            "shipping_phone": "0911223344",
            "shipping_address": "789 Đường Test"
        }, headers=cust_headers)
        cancel_order_id = cancel_order_res.json()["id"]

        do_cancel_res = await client.put(f"/api/orders/{cancel_order_id}/cancel", headers=cust_headers)
        assert do_cancel_res.status_code == 200
        assert do_cancel_res.json()["status"] == "cancelled"
        print("[OK] Customer successfully cancelled order in 'pending' status.")

        # 7. Admin transitions main order: pending -> confirmed -> shipping
        conf_res = await client.put(f"/api/orders/{order_id}/status", json={"status": "confirmed"}, headers=admin_headers)
        assert conf_res.status_code == 200
        assert conf_res.json()["status"] == "confirmed"

        ship_res = await client.put(f"/api/orders/{order_id}/status", json={"status": "shipping"}, headers=admin_headers)
        assert ship_res.status_code == 200
        assert ship_res.json()["status"] == "shipping"
        print("[OK] Admin transitioned order status to 'shipping'.")

        # 8. Verify Customer received notification 'order_shipping'
        cust_notifs = await client.get("/api/notifications", headers=cust_headers)
        assert cust_notifs.status_code == 200
        cust_ship_notifs = [n for n in cust_notifs.json() if n["type"] == "order_shipping" and n["reference_code"] == order_code]
        assert len(cust_ship_notifs) == 1
        print("[OK] Customer received 'order_shipping' notification.")

        # 9. Try Admin transition shipping -> completed when customer_confirmed == False -> Expect 400
        bad_complete = await client.put(f"/api/orders/{order_id}/status", json={"status": "completed"}, headers=admin_headers)
        assert bad_complete.status_code == 400
        assert "Chưa thể hoàn thành" in bad_complete.json()["detail"]
        print("[OK] Admin transition to 'completed' blocked when customer_confirmed is False.")

        # 10. Customer confirms received -> PUT /api/orders/{order_id}/confirm-received
        conf_recv_res = await client.put(f"/api/orders/{order_id}/confirm-received", headers=cust_headers)
        assert conf_recv_res.status_code == 200
        assert conf_recv_res.json()["customer_confirmed"] == True
        print("[OK] Customer confirmed order received.")

        # 11. Verify Admin received notification 'order_received'
        admin_notifs2 = await client.get("/api/notifications", headers=admin_headers)
        assert admin_notifs2.status_code == 200
        recv_notifs = [n for n in admin_notifs2.json() if n["type"] == "order_received" and n["reference_code"] == order_code]
        assert len(recv_notifs) >= 1
        print("[OK] Admin received 'order_received' notification.")

        # 12. Admin transition shipping -> completed now -> Expect 200
        good_complete = await client.put(f"/api/orders/{order_id}/status", json={"status": "completed"}, headers=admin_headers)
        assert good_complete.status_code == 200
        assert good_complete.json()["status"] == "completed"
        print("[OK] Admin successfully completed order after customer confirmation.")

        # Cleanup
        async with AsyncSessionLocal() as db:
            await db.execute(delete(OrderItem).where(OrderItem.order_id.in_([order_id, cancel_order_id])))
            await db.execute(delete(Order).where(Order.id.in_([order_id, cancel_order_id])))
            await db.commit()
        await client.delete(f"/api/products/{prod_id}", headers=admin_headers)
        print("[OK] Cleaned up test data.")

    print("==========================================")
    print("[SUCCESS] ALL DAY 20 WORKFLOW & NOTIFICATIONS TESTS PASSED!")
    print("==========================================")
