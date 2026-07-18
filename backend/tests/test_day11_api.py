import pytest
import httpx
from httpx import ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_day11_public_products_api():
    print("\n==========================================")
    print("STARTING DAY 11 PUBLIC PRODUCTS API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 0. Login admin to prepare some test products & categories
        res_login = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200, f"Login failed: {res_login.text}"
        token = res_login.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test category
        res_cat = await client.post("/api/categories", json={
            "name": "Category Day11 Test",
            "description": "Test category for Day 11"
        }, headers=headers)
        assert res_cat.status_code == 201, f"Create category failed: {res_cat.text}"
        cat_id = res_cat.json()["id"]

        # Create Available Product 1 with specific ingredients
        res_p1 = await client.post("/api/products", json={
            "name": "Pizza Day11 Hải Sản Pesto",
            "description": "Thơm ngon vị pesto",
            "price": 220000,
            "category_id": cat_id,
            "is_available": True,
            "ingredients": ["Tôm Tươi Day11", "Mực Ống Day11", "Sốt Pesto"],
            "sizes": [{"size_name": "S", "price_multiplier": 1.0, "extra_price": 0}],
            "toppings": [{"topping_name": "Phô mai thêm Day11", "extra_price": 25000}]
        }, headers=headers)
        assert res_p1.status_code == 201
        p1_id = res_p1.json()["id"]

        # Create Available Product 2 in same category
        res_p2 = await client.post("/api/products", json={
            "name": "Gà Rán Day11 Sốt Cay",
            "description": "Giòn rụm",
            "price": 140000,
            "category_id": cat_id,
            "is_available": True,
            "ingredients": ["Thịt Gà Day11", "Sốt Cay Hàn Quốc"],
            "sizes": [],
            "toppings": []
        }, headers=headers)
        assert res_p2.status_code == 201
        p2_id = res_p2.json()["id"]

        # Create Unavailable Product 3
        res_p3 = await client.post("/api/products", json={
            "name": "Món Ngừng Bán Day11",
            "description": "Không bán nữa",
            "price": 180000,
            "category_id": cat_id,
            "is_available": False,
            "ingredients": ["Bí Mật"],
            "sizes": [],
            "toppings": []
        }, headers=headers)
        assert res_p3.status_code == 201
        p3_id = res_p3.json()["id"]

        try:
            # 1. Test basic paginated fetch (GET /api/public/products) with large page_size to check newly added items
            res_pub = await client.get("/api/public/products?page_size=100")
            assert res_pub.status_code == 200, f"GET /api/public/products failed: {res_pub.text}"
            data = res_pub.json()
            assert "items" in data
            assert "total_count" in data
            assert "total_pages" in data
            assert "page" in data
            assert "page_size" in data
            # Check compatibility fields
            assert data["total"] == data["total_count"]
            assert data["limit"] == data["page_size"]

            # Check that all products including p3 (unavailable/Hết món) are returned by default for customer display
            item_ids = [item["id"] for item in data["items"]]
            assert p1_id in item_ids
            assert p2_id in item_ids
            assert p3_id in item_ids
            print(f"[OK] GET /api/public/products returns {len(data['items'])} items, including unavailable items for 'Hết món' tag display.")

            # Check explicit filtering by is_available=true
            res_pub_avail = await client.get("/api/public/products?is_available=true&page_size=100")
            assert res_pub_avail.status_code == 200
            avail_ids = [item["id"] for item in res_pub_avail.json()["items"]]
            assert p1_id in avail_ids
            assert p2_id in avail_ids
            assert p3_id not in avail_ids
            print("[OK] GET /api/public/products?is_available=true correctly filters out unavailable items.")

            # Check eager loaded fields on p1
            p1_public = next(item for item in data["items"] if item["id"] == p1_id)
            assert "Tôm Tươi Day11" in p1_public["ingredients"]
            assert len(p1_public["sizes"]) == 1
            assert len(p1_public["toppings"]) == 1
            print("[OK] Eager loading (ingredients, sizes, toppings) works correctly.")

            # 2. Test Pagination
            res_page = await client.get("/api/public/products?page=1&page_size=1")
            assert res_page.status_code == 200
            page_data = res_page.json()
            assert len(page_data["items"]) == 1
            assert page_data["page"] == 1
            assert page_data["page_size"] == 1
            assert page_data["total_pages"] >= 2
            print("[OK] Pagination params page & page_size work correctly.")

            # 3. Test Category filter
            res_cat_filter = await client.get(f"/api/public/products?category_id={cat_id}")
            assert res_cat_filter.status_code == 200
            cat_data = res_cat_filter.json()
            assert all(item["category_id"] == cat_id for item in cat_data["items"])
            assert any(item["id"] == p1_id for item in cat_data["items"])
            print("[OK] Filtering by category_id works correctly.")

            # 4. Test Price range filter
            res_price = await client.get("/api/public/products?min_price=200000&max_price=250000")
            assert res_price.status_code == 200
            price_data = res_price.json()
            for item in price_data["items"]:
                assert 200000 <= float(item["price"]) <= 250000
            assert any(item["id"] == p1_id for item in price_data["items"])
            assert not any(item["id"] == p2_id for item in price_data["items"]) # p2 is 140000
            print("[OK] Filtering by min_price & max_price works correctly.")

            # 5. Test Search by Product Name
            res_s_name = await client.get("/api/public/products?search=Hải%20Sản%20Pesto")
            assert res_s_name.status_code == 200
            s_name_data = res_s_name.json()
            assert any(item["id"] == p1_id for item in s_name_data["items"])
            print("[OK] Searching by product name works correctly.")

            # 6. Test Search by Ingredient Name (e.g., searching "Mực Ống Day11")
            res_s_ing = await client.get("/api/public/products?search=Mực%20Ống%20Day11")
            assert res_s_ing.status_code == 200
            s_ing_data = res_s_ing.json()
            assert any(item["id"] == p1_id for item in s_ing_data["items"])
            assert not any(item["id"] == p2_id for item in s_ing_data["items"])
            print("[OK] Searching by ingredient name works correctly.")

            # 7. Test Single Product Details endpoint (GET /api/public/products/{id})
            res_detail_p1 = await client.get(f"/api/public/products/{p1_id}")
            assert res_detail_p1.status_code == 200
            assert res_detail_p1.json()["id"] == p1_id
            print("[OK] GET /api/public/products/{id} returns public product detail correctly.")

            # Check that single product endpoint for unavailable product returns 200 so status/tag can be displayed
            res_detail_p3 = await client.get(f"/api/public/products/{p3_id}")
            assert res_detail_p3.status_code == 200
            assert res_detail_p3.json()["is_available"] is False
            print("[OK] GET /api/public/products/{id} for unavailable product returns 200 with is_available=False correctly.")

        finally:
            # Clean up test products and category
            await client.delete(f"/api/products/{p1_id}", headers=headers)
            await client.delete(f"/api/products/{p2_id}", headers=headers)
            await client.delete(f"/api/products/{p3_id}", headers=headers)
            await client.delete(f"/api/categories/{cat_id}", headers=headers)
            print("[OK] Cleaned up Day 11 test data.")
