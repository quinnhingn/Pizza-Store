import asyncio
import httpx
from httpx import ASGITransport
from app.main import app

async def test_day9_sizes_toppings():
    print("\n==========================================")
    print("STARTING DAY 9 SIZES & TOPPINGS API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Login admin
        res_login = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_login.status_code == 200, f"Login failed: {res_login.text}"
        token = res_login.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Master Sizes CRUD
        res_get_sizes = await client.get("/api/sizes")
        assert res_get_sizes.status_code == 200, f"GET sizes failed: {res_get_sizes.text}"
        print(f"[OK] GET /api/sizes returned {len(res_get_sizes.json())} sizes.")

        res_create_size = await client.post("/api/sizes", json={
            "name": "Size Test Day9",
            "default_price_multiplier": 1.35,
            "default_extra_price": 40000
        }, headers=headers)
        if res_create_size.status_code == 400 and "already exists" in res_create_size.text:
            print("[INFO] Size already existed.")
        else:
            assert res_create_size.status_code == 201, f"Create size failed: {res_create_size.text}"
            size_id = res_create_size.json()["id"]
            print(f"[OK] Created master size: {res_create_size.json()}")

            res_up_size = await client.put(f"/api/sizes/{size_id}", json={
                "name": "Size Test Day9 Updated",
                "default_price_multiplier": 1.40
            }, headers=headers)
            assert res_up_size.status_code == 200, f"Update size failed: {res_up_size.text}"
            print(f"[OK] Updated master size: {res_up_size.json()}")

            res_del_size = await client.delete(f"/api/sizes/{size_id}", headers=headers)
            assert res_del_size.status_code == 200, f"Delete size failed: {res_del_size.text}"
            print("[OK] Deleted master size successfully.")

        # 2. Master Toppings CRUD
        res_get_tp = await client.get("/api/toppings")
        assert res_get_tp.status_code == 200, f"GET toppings failed: {res_get_tp.text}"
        print(f"[OK] GET /api/toppings returned {len(res_get_tp.json())} toppings.")

        res_create_tp = await client.post("/api/toppings", json={
            "name": "Topping Test Day9",
            "default_extra_price": 25000
        }, headers=headers)
        if res_create_tp.status_code == 400 and "already exists" in res_create_tp.text:
            print("[INFO] Topping already existed.")
        else:
            assert res_create_tp.status_code == 201, f"Create topping failed: {res_create_tp.text}"
            tp_id = res_create_tp.json()["id"]
            print(f"[OK] Created master topping: {res_create_tp.json()}")

            res_up_tp = await client.put(f"/api/toppings/{tp_id}", json={
                "name": "Topping Test Day9 Updated",
                "default_extra_price": 30000
            }, headers=headers)
            assert res_up_tp.status_code == 200, f"Update topping failed: {res_up_tp.text}"
            print(f"[OK] Updated master topping: {res_up_tp.json()}")

            res_del_tp = await client.delete(f"/api/toppings/{tp_id}", headers=headers)
            assert res_del_tp.status_code == 200, f"Delete topping failed: {res_del_tp.text}"
            print("[OK] Deleted master topping successfully.")

        # 3. Create Product with sizes and toppings
        prod_data = {
            "name": "Pizza Test Day9 Sizes & Toppings",
            "description": "Integration test for product sizes and toppings",
            "price": 150000,
            "is_available": True,
            "ingredients": ["Phô mai Day9", "Xúc xích Day9"],
            "sizes": [
                {"size_name": "S", "price_multiplier": 1.0, "extra_price": 0},
                {"size_name": "M", "price_multiplier": 1.25, "extra_price": 30000}
            ],
            "toppings": [
                {"topping_name": "Thêm phô mai", "extra_price": 20000},
                {"topping_name": "Viền phô mai", "extra_price": 35000}
            ]
        }
        res_prod = await client.post("/api/products", json=prod_data, headers=headers)
        assert res_prod.status_code == 201, f"Create product failed: {res_prod.text}"
        prod_resp = res_prod.json()
        prod_id = prod_resp["id"]
        print(f"[OK] Created product with sizes & toppings: ID {prod_id}")
        assert len(prod_resp["sizes"]) == 2, f"Expected 2 sizes, got {len(prod_resp['sizes'])}"
        assert len(prod_resp["toppings"]) == 2, f"Expected 2 toppings, got {len(prod_resp['toppings'])}"
        print(f"[OK] Product has {len(prod_resp['sizes'])} sizes and {len(prod_resp['toppings'])} toppings.")

        # 4. Update Product sizes and toppings
        up_data = {
            "sizes": [
                {"size_name": "L", "price_multiplier": 1.5, "extra_price": 50000}
            ],
            "toppings": [
                {"topping_name": "Thêm nấm", "extra_price": 15000}
            ]
        }
        res_up_prod = await client.put(f"/api/products/{prod_id}", json=up_data, headers=headers)
        assert res_up_prod.status_code == 200, f"Update product failed: {res_up_prod.text}"
        up_resp = res_up_prod.json()
        assert len(up_resp["sizes"]) == 1 and up_resp["sizes"][0]["size_name"] == "L"
        assert len(up_resp["toppings"]) == 1 and up_resp["toppings"][0]["topping_name"] == "Thêm nấm"
        print(f"[OK] Updated product sizes and toppings successfully.")

        # Cleanup
        res_del_prod = await client.delete(f"/api/products/{prod_id}", headers=headers)
        assert res_del_prod.status_code == 200, f"Delete product failed: {res_del_prod.text}"
        print(f"[OK] Cleaned up test product #{prod_id}.")

    print("==========================================")
    print("[SUCCESS] ALL DAY 9 SIZES & TOPPINGS TESTS PASSED 100%!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(test_day9_sizes_toppings())
