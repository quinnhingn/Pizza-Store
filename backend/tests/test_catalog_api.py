import asyncio
import httpx
from httpx import ASGITransport
from app.main import app

async def test_ingredients_crud():
    print("\n==========================================")
    print("STARTING INGREDIENTS MASTER CATALOG TESTS")
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

        # 1. Get ingredients
        res_get = await client.get("/api/ingredients")
        assert res_get.status_code == 200, f"GET failed: {res_get.text}"
        print(f"[OK] GET /api/ingredients returned {len(res_get.json())} ingredients.")

        # 2. Create ingredient
        test_name = "Tôm sú test_catalog"
        res_create = await client.post("/api/ingredients", json={"name": test_name}, headers=headers)
        if res_create.status_code == 400 and "đã tồn tại" in res_create.text:
            print("[INFO] Ingredient already existed, proceeding...")
        else:
            assert res_create.status_code == 201, f"Create failed: {res_create.text}"
            print(f"[OK] Created ingredient: {res_create.json()}")
            ing_id = res_create.json()["id"]

            # 3. Update ingredient
            res_update = await client.put(f"/api/ingredients/{ing_id}", json={"name": "Tôm sú test_catalog_updated"}, headers=headers)
            assert res_update.status_code == 200, f"Update failed: {res_update.text}"
            print(f"[OK] Updated ingredient: {res_update.json()}")

            # 4. Delete ingredient
            res_del = await client.delete(f"/api/ingredients/{ing_id}", headers=headers)
            assert res_del.status_code == 200, f"Delete failed: {res_del.text}"
            print("[OK] Deleted ingredient successfully.")

    print("==========================================")
    print("[SUCCESS] INGREDIENTS MASTER CATALOG TESTS PASSED!")
    print("==========================================")

if __name__ == "__main__":
    asyncio.run(test_ingredients_crud())
