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

    cloudinary_error = None
    if is_cloudinary_configured():
        init_cloudinary()
        try:
            # Run synchronous Cloudinary upload in thread pool to avoid blocking async loop
            result = await asyncio.to_thread(
                cloudinary.uploader.upload,
                file.file,
                folder="pizza_store/products"
            )
            secure_url = result.get("secure_url")
            public_id = result.get("public_id")
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
            # If Cloudinary fails (e.g., permission issue or network error), fallback to local storage
            cloudinary_error = str(e)
            # Reset file read pointer in case Cloudinary consumed bytes
            await file.seek(0)

    # Local fallback storage when Cloudinary is not configured or fails
    upload_dir = os.path.join("static", "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "png"
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu file cục bộ: {str(e)}"
        )

    # Assuming default development server at http://localhost:8000
    url = f"http://localhost:8000/static/uploads/{unique_filename}"
    message = "Tải ảnh lên server cục bộ (Local Fallback) thành công"
    if cloudinary_error:
        message = f"Tải ảnh vào server cục bộ do Cloudinary gặp lỗi: {cloudinary_error}"

    return {
        "status": "success",
        "data": {
            "url": url,
            "public_id": unique_filename,
            "provider": "local"
        },
        "message": message
    }
