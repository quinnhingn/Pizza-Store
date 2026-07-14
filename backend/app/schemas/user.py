from pydantic import BaseModel, EmailStr
from typing import Optional

# Incoming Payload: Registration
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str
    full_name: str

# Incoming Payload: Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Sub-model for Login Response
class UserData(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str

    class Config:
        from_attributes = True

# Outgoing Payload: Token + User Info
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserData