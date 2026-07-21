import sys
import pytest
import httpx
from httpx import ASGITransport
from datetime import datetime
from sqlalchemy import delete
from app.main import app
from app.core.database import AsyncSessionLocal
from app.models.voucher import Voucher
from app.models.user_notification import UserNotification
from app.models.user_voucher import UserVoucher

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

@pytest.mark.asyncio
async def test_day16_admin_vouchers_gift_and_wallet():
    print("\n==========================================")
    print("STARTING DAY 16 ADMIN VOUCHERS, GIFTING & WALLET API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Login Admin
        res_admin_login = await client.post("/api/auth/login", json={
            "email": "admin_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_admin_login.status_code == 200, f"Admin login failed: {res_admin_login.text}"
        admin_token = res_admin_login.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Login Customer
        res_cust_login = await client.post("/api/auth/login", json={
            "email": "customer_day6@pizzastore.com",
            "password": "Password123!"
        })
        assert res_cust_login.status_code == 200, f"Customer login failed: {res_cust_login.text}"
        cust_token = res_cust_login.json()["data"]["access_token"]
        cust_headers = {"Authorization": f"Bearer {cust_token}"}
        cust_id = res_cust_login.json()["data"]["user"]["id"]

        # 3. Admin create a test voucher
        test_code = "GIFTTEST99"
        # Cleanup first if leftover
        async with AsyncSessionLocal() as db:
            await db.execute(delete(UserVoucher).where(UserVoucher.voucher_code == test_code))
            await db.execute(delete(UserNotification).where(UserNotification.reference_code == test_code))
            await db.execute(delete(Voucher).where(Voucher.code == test_code))
            await db.commit()

        create_res = await client.post("/api/vouchers", json={
            "code": test_code,
            "discount_amount": 99000,
            "min_order_value": 150000,
            "start_date": "2026-01-01T00:00:00",
            "end_date": "2027-12-31T23:59:59",
            "usage_limit": 100,
            "is_active": True
        }, headers=admin_headers)
        assert create_res.status_code == 201, f"Create voucher failed: {create_res.text}"
        v_id = create_res.json()["id"]
        print(f"[OK] Admin created test voucher: {test_code} (ID: {v_id})")

        # 4. Admin GET all vouchers including inactive
        get_all_res = await client.get("/api/vouchers/admin/all", headers=admin_headers)
        assert get_all_res.status_code == 200
        codes = [v["code"] for v in get_all_res.json()]
        assert test_code in codes
        print("[OK] Admin GET /api/vouchers/admin/all works correctly.")

        # 5. Admin update voucher
        update_res = await client.put(f"/api/vouchers/{v_id}", json={
            "usage_limit": 200
        }, headers=admin_headers)
        assert update_res.status_code == 200
        assert update_res.json()["usage_limit"] == 200
        print("[OK] Admin updated voucher successfully.")

        # 6. Admin toggle status
        toggle_res = await client.patch(f"/api/vouchers/{v_id}/status", headers=admin_headers)
        assert toggle_res.status_code == 200
        assert toggle_res.json()["is_active"] is False
        # Toggle back
        toggle_res2 = await client.patch(f"/api/vouchers/{v_id}/status", headers=admin_headers)
        assert toggle_res2.status_code == 200
        assert toggle_res2.json()["is_active"] is True
        print("[OK] Admin toggled voucher status successfully.")

        # 7. Admin Gift Voucher to Customer
        gift_res = await client.post(f"/api/vouchers/{v_id}/gift", json={
            "send_to_all": False,
            "user_ids": [cust_id],
            "custom_message": "Tặng bạn mã giảm giá 99K mừng sinh nhật!"
        }, headers=admin_headers)
        assert gift_res.status_code == 200, f"Gift voucher failed: {gift_res.text}"
        print("[OK] Admin gifted voucher to Customer successfully.")

        # 8. Customer GET notifications
        notif_res = await client.get("/api/notifications", headers=cust_headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        assert len(notifs) > 0
        target_notif = next((n for n in notifs if n["reference_code"] == test_code), None)
        assert target_notif is not None
        assert target_notif["is_read"] is False
        assert target_notif["message"] == "Tặng bạn mã giảm giá 99K mừng sinh nhật!"
        print("[OK] Customer received gift notification correctly.")

        # 9. Customer Save Voucher to wallet
        save_res = await client.post("/api/vouchers/save", json={
            "code": test_code,
            "notification_id": target_notif["id"]
        }, headers=cust_headers)
        assert save_res.status_code == 200, f"Save voucher failed: {save_res.text}"
        print("[OK] Customer saved voucher to wallet successfully.")

        # 10. Verify notification marked read
        notif_check = await client.get("/api/notifications", headers=cust_headers)
        target_notif_read = next((n for n in notif_check.json() if n["id"] == target_notif["id"]), None)
        assert target_notif_read["is_read"] is True
        print("[OK] Notification automatically marked read after saving voucher.")

        # 11. Customer GET my-saved-vouchers
        wallet_res = await client.get("/api/vouchers/my-saved-vouchers", headers=cust_headers)
        assert wallet_res.status_code == 200
        wallet_codes = [item["voucher_code"] for item in wallet_res.json()]
        assert test_code in wallet_codes
        print("[OK] Customer GET /api/vouchers/my-saved-vouchers verified successfully.")

        # 12. Cleanup test voucher & notifications
        async with AsyncSessionLocal() as db:
            await db.execute(delete(UserVoucher).where(UserVoucher.voucher_code == test_code))
            await db.execute(delete(UserNotification).where(UserNotification.reference_code == test_code))
            await db.execute(delete(Voucher).where(Voucher.code == test_code))
            await db.commit()
        print("[OK] Cleaned up Day 16 Admin Vouchers & Wallet test data.")

    print("==========================================")
    print("[SUCCESS] DAY 16 ADMIN VOUCHERS & WALLET API TESTS PASSED 100%!")
    print("==========================================")
