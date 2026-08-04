from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError

from app.core.database import AsyncSessionLocal
from app.core.security import SECRET_KEY, ALGORITHM
from app.models.user import User

# HTTPBearer extracts token from 'Authorization: Bearer <token>'
security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

async def get_db() -> AsyncSession:
    """Database session generator."""
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Validate JWT token and return the current active User."""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode JWT Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Query database for user
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
    """Validate JWT token if provided and return the User, or return None if no token."""
    if not credentials:
        return None
        
    token = credentials.credentials
    try:
        # Decode JWT Token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    # Query database for user
    stmt = select(User).where(User.id == int(user_id), User.is_active == True)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Validate that current active user has 'admin' role."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user