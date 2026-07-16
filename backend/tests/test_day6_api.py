import asyncio
import sys
import httpx
from httpx import ASGITransport
from sqlalchemy.future import select
from sqlalchemy import update, delete

# Ensure utf-8 encoding for stdout on windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.main import app
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User
from app.models.category import Category
from app.models.product import Product, Ingredient, ProductIngredient

async def setup_users():
    """Ensure test admin and test customer users exist with proper roles."""
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == "admin_day6@pizzastore.com")
        res = await session.execute(stmt)
        admin = res.scalar_one_or_none()
        if admin:
            admin.role = "admin"
        await session.commit()

async def run_tests():
    print("==========================================")
    print("STARTING DAY 6 API TESTS (AsyncClient)")
    print("==========================================")

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Register or Login Admin
        print("\n[Step 1] Registering test users...")
        admin_data = {
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "full_name": "Admin Day 6 Test"
        }
        res = await client.post("/api/auth/register", json=admin_data)
        if res.status_code not in (200, 201, 400):
            print(f"FAILED to register admin: {res.text}")
            sys.exit(1)

        customer_data = {
            "email": "customer_day6@pizzastore.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "full_name": "Customer Day 6 Test"
        }
        res = await client.post("/api/auth/register", json=customer_data)
        if res.status_code not in (200, 201, 400):
            print(f"FAILED to register customer: {res.text}")
            sys.exit(1)

        # Update admin role directly via DB
        print("[Step 2] Updating role='admin' in DB for admin_day6@pizzastore.com...")
        await setup_users()

        # Login Admin
        res_login_admin = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_login_admin.status_code == 200, f"Admin login failed: {res_login_admin.text}"
        admin_token = res_login_admin.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # Login Customer
        res_login_cust = await client.post("/api/auth/login", json={
            "email": "customer_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_login_cust.status_code == 200, f"Customer login failed: {res_login_cust.text}"
        customer_token = res_login_cust.json()["data"]["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}

        print("[OK] Users logged in successfully.")

        # 2. Test Public GET categories & products
        print("\n[Step 3] Testing Public endpoints (GET /api/categories & /api/products)...")
        res_cats = await client.get("/api/categories")
        assert res_cats.status_code == 200, f"GET categories failed: {res_cats.text}"
        res_prods = await client.get("/api/products")
        assert res_prods.status_code == 200, f"GET products failed: {res_prods.text}"
        print(f"[OK] Public endpoints return 200 OK (Found {len(res_cats.json())} categories, {len(res_prods.json())} products).")

        # 3. Test Access Control (Customer trying to create Category)
        print("\n[Step 4] Testing Access Control (Customer POST /api/categories)...")
        res_403 = await client.post("/api/categories", headers=customer_headers, json={
            "name": "Unauthorized Category"
        })
        assert res_403.status_code == 403, f"Expected 403 Forbidden for customer, got {res_403.status_code}"
        print("[OK] Access Control check passed: Customer received 403 Forbidden.")

        # 4. Test Category CRUD with Admin
        print("\n[Step 5] Testing Category CRUD with Admin...")
        cat_payload = {
            "name": "Pizza Thử Nghiệm Ngày 6",
            "description": "Danh mục tạo từ automated test ngày 6",
            "icon": "https://cdn.icon.com/pizza.png"
        }
        res_cat_create = await client.post("/api/categories", headers=admin_headers, json=cat_payload)
        if res_cat_create.status_code == 400 and "already exists" in res_cat_create.text:
            existing_cats = (await client.get("/api/categories")).json()
            cat_id = [c["id"] for c in existing_cats if c["name"] == cat_payload["name"]][0]
            print(f"Category already existed with ID {cat_id}")
        else:
            assert res_cat_create.status_code == 201, f"Failed to create category: {res_cat_create.text}"
            cat_id = res_cat_create.json()["id"]
            print(f"[OK] Created category ID {cat_id} successfully.")

        # Update Category
        res_cat_update = await client.put(f"/api/categories/{cat_id}", headers=admin_headers, json={
            "description": "Mô tả đã được cập nhật bởi Admin"
        })
        assert res_cat_update.status_code == 200, f"Failed to update category: {res_cat_update.text}"
        assert res_cat_update.json()["description"] == "Mô tả đã được cập nhật bởi Admin"
        print("[OK] Updated category successfully.")

        # 5. Test Product CRUD & Ingredients Sync with Admin
        print("\n[Step 6] Testing Product CRUD and Ingredients Sync with Admin...")
        prod_payload = {
            "name": "Pizza Hải Sản Ngày 6",
            "description": "Pizza hải sản hảo hạng với tôm và mực",
            "price": 189000,
            "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
            "category_id": cat_id,
            "is_available": True,
            "ingredients": ["Tôm tươi", "Mực ống", "Phô mai Mozzarella"]
        }
        res_prod_create = await client.post("/api/products", headers=admin_headers, json=prod_payload)
        assert res_prod_create.status_code == 201, f"Failed to create product: {res_prod_create.text}"
        created_prod = res_prod_create.json()
        prod_id = created_prod["id"]
        print(f"[OK] Created product ID {prod_id} successfully.")
        print(f"  Returned ingredients: {created_prod['ingredients']}")
        assert set(created_prod["ingredients"]) == {"Tôm tươi", "Mực ống", "Phô mai Mozzarella"}, "Ingredients mismatch on creation!"

        # Get Single Product to check ingredients persistence
        res_prod_get = await client.get(f"/api/products/{prod_id}")
        assert res_prod_get.status_code == 200
        assert set(res_prod_get.json()["ingredients"]) == {"Tôm tươi", "Mực ống", "Phô mai Mozzarella"}
        print("[OK] GET /api/products/{id} verified ingredients persisted correctly.")

        # Update Product & Ingredients
        print("\n[Step 7] Updating product price and modifying ingredients...")
        update_payload = {
            "price": 199000,
            "ingredients": ["Tôm tươi", "Phô mai Cheddar", "Sốt tiêu đen"]
        }
        res_prod_update = await client.put(f"/api/products/{prod_id}", headers=admin_headers, json=update_payload)
        assert res_prod_update.status_code == 200, f"Failed to update product: {res_prod_update.text}"
        updated_prod = res_prod_update.json()
        print(f"  Updated price: {updated_prod['price']}")
        print(f"  Updated ingredients: {updated_prod['ingredients']}")
        assert float(updated_prod["price"]) == 199000.0
        assert set(updated_prod["ingredients"]) == {"Tôm tươi", "Phô mai Cheddar", "Sốt tiêu đen"}, "Ingredients mismatch on update!"
        print("[OK] Product updated & ingredients synced successfully.")

        # 6. Test Delete Product & Category
        print("\n[Step 8] Testing Deletion of Product and Category...")
        res_del_prod = await client.delete(f"/api/products/{prod_id}", headers=admin_headers)
        assert res_del_prod.status_code == 200, f"Failed to delete product: {res_del_prod.text}"
        print(f"[OK] Deleted product ID {prod_id} successfully.")

        res_del_cat = await client.delete(f"/api/categories/{cat_id}", headers=admin_headers)
        assert res_del_cat.status_code == 200, f"Failed to delete category: {res_del_cat.text}"
        print(f"[OK] Deleted category ID {cat_id} successfully.")

        print("\n==========================================")
        print("[SUCCESS] ALL DAY 6 AUTOMATED TESTS PASSED 100%!")
        print("==========================================")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_tests())

