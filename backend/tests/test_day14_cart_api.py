import pytest
import httpx
from httpx import ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_day14_cart_api():
    print("\n==========================================")
    print("STARTING DAY 14 CART API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login admin or register a test user for cart operations
        login_res = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a category and product for testing
        cat_res = await client.post("/api/categories", json={
            "name": "Cart Test Category Day 14",
            "description": "For day 14 cart testing"
        }, headers=headers)
        if cat_res.status_code == 201:
            cat_id = cat_res.json()["id"]
        else:
            # If exists or error, fetch first category
            cats_res = await client.get("/api/categories")
            cat_id = cats_res.json()[0]["id"]

        prod_res = await client.post("/api/products", json={
            "name": "Pizza Cart Test Day 14",
            "description": "Pizza ngon cho giỏ hàng",
            "price": 150000,
            "category_id": cat_id,
            "is_available": True
        }, headers=headers)
        assert prod_res.status_code == 201, f"Create product failed: {prod_res.text}"
        prod_id = prod_res.json()["id"]

        # 3. Clear cart to start clean
        clear_res = await client.delete("/api/cart/clear", headers=headers)
        assert clear_res.status_code == 204, f"Clear cart failed: {clear_res.text}"

        # Verify initial cart is empty
        get_res = await client.get("/api/cart", headers=headers)
        assert get_res.status_code == 200
        data = get_res.json()
        assert data["total_items"] == 0
        assert float(data["subtotal"]) == 0.0
        assert len(data["items"]) == 0

        # 4. Add item 1 to cart
        add_payload_1 = {
            "product_id": prod_id,
            "size_name": "L",
            "toppings": [{"name": "Phô mai thêm", "price": 25000}],
            "quantity": 2,
            "note": "Ít cay",
            "unit_price": 175000
        }
        res1 = await client.post("/api/cart/items", json=add_payload_1, headers=headers)
        assert res1.status_code == 201, f"Add item 1 failed: {res1.text}"
        item1 = res1.json()
        item1_id = item1["id"]
        assert item1["quantity"] == 2
        assert float(item1["total_price"]) == 350000.0

        # 5. Smart Merging: Add same product, size, toppings, note -> should merge into item1
        add_payload_merge = {
            "product_id": prod_id,
            "size_name": "L",
            "toppings": [{"name": "Phô mai thêm", "price": 25000}],
            "quantity": 3,
            "note": "Ít cay",
            "unit_price": 175000
        }
        res_merge = await client.post("/api/cart/items", json=add_payload_merge, headers=headers)
        assert res_merge.status_code == 201
        item_merged = res_merge.json()
        assert item_merged["id"] == item1_id, "Smart merging should keep same ID"
        assert item_merged["quantity"] == 5, f"Expected quantity 2 + 3 = 5, got {item_merged['quantity']}"
        assert float(item_merged["total_price"]) == 875000.0

        # 6. Add same product but different size -> should create new item
        add_payload_diff_size = {
            "product_id": prod_id,
            "size_name": "M",
            "toppings": [],
            "quantity": 1,
            "note": "",
            "unit_price": 150000
        }
        res_diff = await client.post("/api/cart/items", json=add_payload_diff_size, headers=headers)
        assert res_diff.status_code == 201
        item2 = res_diff.json()
        assert item2["id"] != item1_id, "Different size should create distinct cart item"
        assert item2["quantity"] == 1

        # 7. Get Cart summary
        get_res_2 = await client.get("/api/cart", headers=headers)
        assert get_res_2.status_code == 200
        summary = get_res_2.json()
        assert summary["total_items"] == 6  # 5 + 1
        assert float(summary["subtotal"]) == 875000.0 + 150000.0
        assert len(summary["items"]) == 2

        # 8. Update quantity of item 2
        up_res = await client.put(f"/api/cart/items/{item2['id']}", json={"quantity": 4}, headers=headers)
        assert up_res.status_code == 200
        up_data = up_res.json()
        assert up_data["quantity"] == 4
        assert float(up_data["total_price"]) == 600000.0

        # 9. Delete item 1
        del_res = await client.delete(f"/api/cart/items/{item1_id}", headers=headers)
        assert del_res.status_code == 204

        get_res_3 = await client.get("/api/cart", headers=headers)
        assert get_res_3.json()["total_items"] == 4
        assert len(get_res_3.json()["items"]) == 1

        # 10. Clear cart
        clear_res_2 = await client.delete("/api/cart/clear", headers=headers)
        assert clear_res_2.status_code == 204

        get_res_final = await client.get("/api/cart", headers=headers)
        assert get_res_final.json()["total_items"] == 0
        assert len(get_res_final.json()["items"]) == 0

        # 11. Cleanup test product and category so they do not pollute live database/menu
        await client.delete(f"/api/products/{prod_id}", headers=headers)
        await client.delete(f"/api/categories/{cat_id}", headers=headers)

        print("\n=== DAY 14 CART API TESTS PASSED SUCCESSFULLY! ===")
