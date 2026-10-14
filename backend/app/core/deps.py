from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError

from app.core.database import AsyncSessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

# HTTPBearer tự động trích xuất token từ header 'Authorization: Bearer <token>'
security = HTTPBearer()
# Phiên bản tùy chọn: không bắt lỗi nếu không có token (dùng cho endpoint công khai tùy chọn)
security_optional = HTTPBearer(auto_error=False)

async def get_db() -> AsyncSession:
    """Tạo phiên kết nối cơ sở dữ liệu (dependency injection cho FastAPI)."""
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Xác thực JWT token và trả về người dùng đang đăng nhập."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Giải mã JWT Token để lấy thông tin payload
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Truy vấn cơ sở dữ liệu để xác nhận user tồn tại và đang hoạt động
    stmt = select(User).where(User.id == int(user_id), User.is_active == True)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security_optional),
    db: AsyncSession = Depends(get_db)
) -> User | None:
    """Xác thực JWT token nếu có, trả về User hoặc None nếu không có token (dùng cho guest)."""
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        # Giải mã JWT Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    # Truy vấn DB để lấy thông tin user
    stmt = select(User).where(User.id == int(user_id), User.is_active == True)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Kiểm tra người dùng hiện tại có vai trò 'admin' hay không. Nếu không thì từ chối quyền truy cập."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user