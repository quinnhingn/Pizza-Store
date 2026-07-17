import os
import uuid
import asyncio
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
import cloudinary.uploader

from app.core.deps import get_current_admin_user
from app.models.user import User
from app.core.cloudinary import init_cloudinary, is_cloudinary_configured

router = APIRouter()

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@router.post("/image", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    admin_user: User = Depends(get_current_admin_user)
):
    """Upload product or category image (Admin only). Supports Cloudinary with automatic local fallback."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ hỗ trợ định dạng file ảnh (JPEG, PNG, WEBP, GIF)"
        )

    if not is_cloudinary_configured():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Hệ thống chưa được cấu hình API Cloudinary (thiếu CLOUDINARY_CLOUD_NAME, API_KEY hoặc API_SECRET trong .env)"
        )

    init_cloudinary()
    try:
        # Read file bytes cleanly in async context before passing to thread pool
        content = await file.read()
        result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            content,
            folder="pizza_store/products"
        )
        secure_url = result.get("secure_url")
        public_id = result.get("public_id")
        if not secure_url:
            raise ValueError("Cloudinary không trả về secure_url")

        return {
            "status": "success",
            "data": {
                "url": secure_url,
                "public_id": public_id,
                "provider": "cloudinary"
            },
            "message": "Tải ảnh lên Cloudinary thành công"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tải ảnh lên Cloudinary: {str(e)}"
        )
