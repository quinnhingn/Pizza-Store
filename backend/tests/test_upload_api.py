import asyncio
import sys
import httpx
from httpx import ASGITransport
from sqlalchemy.future import select

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from app.main import app
from app.core.database import AsyncSessionLocal, engine
from app.models.user import User
from app.core.cloudinary import is_cloudinary_configured

async def setup_users():
    """Ensure test admin and test customer users exist with proper roles."""
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.email == "admin_day6@pizzastore.com")
        res = await session.execute(stmt)
        admin = res.scalar_one_or_none()
        if admin:
            admin.role = "admin"
        await session.commit()

async def test_upload_api_flow():
    print("==========================================")
    print("STARTING UPLOAD API TESTS (AsyncClient)")
    print(f"Cloudinary Configured: {is_cloudinary_configured()}")
    print("==========================================")

    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login Admin
        res_login_admin = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        if res_login_admin.status_code != 200:
            print("[INFO] Registering test users first...")
            await client.post("/api/auth/register", json={
                "email": "admin_day6@pizzastore.com",
                "password": "Password123!",
                "confirm_password": "Password123!",
                "full_name": "Admin Day 6 Test"
            })
            await client.post("/api/auth/register", json={
                "email": "customer_day6@pizzastore.com",
                "password": "Password123!",
                "confirm_password": "Password123!",
                "full_name": "Customer Day 6 Test"
            })
            await setup_users()
            res_login_admin = await client.post("/api/auth/login", json={
                "email": "admin_day6@pizzastore.com",
                "password": "Password123!"
            })

        assert res_login_admin.status_code == 200, f"Admin login failed: {res_login_admin.text}"
        admin_token = res_login_admin.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Login Customer
        res_login_cust = await client.post("/api/auth/login", json={
            "email": "customer_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_login_cust.status_code == 200, f"Customer login failed: {res_login_cust.text}"
        customer_token = res_login_cust.json()["data"]["access_token"]
        customer_headers = {"Authorization": f"Bearer {customer_token}"}

        print("[OK] Users logged in successfully.")

        # 3. Test Unauthorized upload by Customer
        print("\n[Step 1] Testing unauthorized upload by Customer...")
        dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0\x00\x00\x00\x00IEND\xaeB`\x82"
        files_cust = {"file": ("test.png", dummy_png, "image/png")}
        res_403 = await client.post("/api/upload/image", headers=customer_headers, files=files_cust)
        assert res_403.status_code == 403, f"Expected 403, got {res_403.status_code}: {res_403.text}"
        print("[OK] Customer upload blocked with 403 Forbidden.")

        # 4. Test Invalid file format upload by Admin
        print("\n[Step 2] Testing invalid content_type upload by Admin...")
        files_invalid = {"file": ("test.txt", b"Hello text file", "text/plain")}
        res_400 = await client.post("/api/upload/image", headers=admin_headers, files=files_invalid)
        assert res_400.status_code == 400, f"Expected 400, got {res_400.status_code}: {res_400.text}"
        print("[OK] Invalid file format rejected with 400 Bad Request.")

        # 5. Test Valid image upload by Admin
        print("\n[Step 3] Testing valid image upload by Admin...")
        files_valid = {"file": ("pizza_test.png", dummy_png, "image/png")}
        res_upload = await client.post("/api/upload/image", headers=admin_headers, files=files_valid)
        assert res_upload.status_code == 201, f"Expected 201, got {res_upload.status_code}: {res_upload.text}"
        
        data = res_upload.json()["data"]
        print(f"[OK] Upload successful!")
        print(f"  URL: {data['url']}")
        print(f"  Provider: {data['provider']}")
        print(f"  Public ID: {data['public_id']}")

        assert data["url"], "URL should not be empty"
        assert data["provider"] in ("cloudinary", "local")

        print("\n==========================================")
        print("[SUCCESS] ALL UPLOAD API TESTS PASSED 100%!")
        print("==========================================")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_upload_api_flow())
