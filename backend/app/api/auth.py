from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.schemas.user import UserRegister, UserLogin
from app.models.user import User
from app.core.deps import get_db
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Xử lý đăng ký tài khoản người dùng mới và mã hóa mật khẩu."""
    if user_in.password != user_in.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Kiểm tra email đã tồn tại trong hệ thống chưa
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Tạo bản ghi người dùng mới với mật khẩu đã được hash
    new_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return {
        "status": "success",
        "data": {
            "user_id": new_user.id, 
            "email": new_user.email, 
            "full_name": new_user.full_name
        },
        "message": "User registered successfully"
    }

@router.post("/login")
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    """Xác thực người dùng và cấp JWT Access Token khi đăng nhập thành công."""
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Kiểm tra email tồn tại và mật khẩu khớp
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Tạo JWT Token chứa user_id
    access_token = create_access_token(subject=user.id)
    
    return {
        "status": "success",
        "data": {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        },
        "message": "Login successful"
    }

@router.post("/logout")
async def logout():
    """Đăng xuất: token sẽ được xóa ở phía client, server không cần xử lý gì thêm."""
    return {
        "status": "success",
        "data": None,
        "message": "Logged out"
    }