import os
from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# Đọc các cấu hình bảo mật từ biến môi trường
SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-key-for-dev")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác thực mật khẩu người dùng nhập vào với mật khẩu đã được mã hóa trong DB."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )

def get_password_hash(password: str) -> str:
    """Tạo chuỗi hash bcrypt từ mật khẩu thô khi đăng ký tài khoản mới."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def create_access_token(subject: Union[str, Any], expires_delta: timedelta | None = None) -> str:
    """Tạo JWT Access Token với thời gian hết hạn."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Đóng gói thông tin user_id và thời gian hết hạn vào payload
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt