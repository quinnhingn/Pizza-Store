import pytest
import httpx
from httpx import ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_day16_voucher_api():
    print("\n==========================================")
    print("STARTING DAY 16 VOUCHER API TESTS")
    print("==========================================")
    transport = ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Test non-existent voucher
        res_not_found = await client.post("/api/vouchers/validate", json={
            "code": "INVALIDCODE",
            "order_value": 300000
        })
        assert res_not_found.status_code == 200
        data_nf = res_not_found.json()
        assert data_nf["valid"] is False
        assert "không tồn tại" in data_nf["message"]
        print("[OK] Tested non-existent voucher correctly.")

        # 2. Test expired voucher
        res_expired = await client.post("/api/vouchers/validate", json={
            "code": "EXPIRED",
            "order_value": 300000
        })
        assert res_expired.status_code == 200
        data_exp = res_expired.json()
        assert data_exp["valid"] is False
        assert ("hết hạn" in data_exp["message"] or "hoạt động" in data_exp["message"] or "hết lượt" in data_exp["message"])
        print("[OK] Tested expired voucher correctly.")

        # 3. Test under minimum order value
        res_min = await client.post("/api/vouchers/validate", json={
            "code": "WELCOME50",
            "order_value": 100000
        })
        assert res_min.status_code == 200
        data_min = res_min.json()
        assert data_min["valid"] is False
        assert "tối thiểu" in data_min["message"]
        print("[OK] Tested under minimum order value condition correctly.")

        # 4. Test valid fixed amount voucher (WELCOME50 on 250,000 order -> 50,000 off)
        res_valid_fixed = await client.post("/api/vouchers/validate", json={
            "code": "welcome50",  # Test case-insensitivity
            "order_value": 250000
        })
        assert res_valid_fixed.status_code == 200
        data_valid = res_valid_fixed.json()
        assert data_valid["valid"] is True
        assert data_valid["discount_amount"] == 50000
        assert data_valid["code"] == "WELCOME50"
        print("[OK] Tested valid fixed amount voucher correctly.")

        # 5. Test valid percentage voucher with max discount limit (PIZZA10 on 600,000 order -> 10% is 60,000 -> max 50,000)
        res_valid_pct = await client.post("/api/vouchers/validate", json={
            "code": "PIZZA10",
            "order_value": 600000
        })
        assert res_valid_pct.status_code == 200
        data_pct = res_valid_pct.json()
        assert data_pct["valid"] is True
        assert data_pct["discount_amount"] == 50000  # Capped at max_discount 50,000
        print("[OK] Tested valid percentage voucher with max discount cap correctly.")

        # 6. Test public get vouchers
        res_get = await client.get("/api/vouchers")
        assert res_get.status_code == 200
        vouchers_list = res_get.json()
        assert len(vouchers_list) >= 3
        print(f"[OK] GET /api/vouchers returned {len(vouchers_list)} active vouchers.")

    print("==========================================")
    print("[SUCCESS] DAY 16 VOUCHER API TESTS PASSED 100%!")
    print("==========================================")
