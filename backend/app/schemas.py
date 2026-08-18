from pydantic import BaseModel, EmailStr
from typing import Optional


# =========================
# User Schemas
# =========================

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr

    class Config:
        from_attributes = True


# =========================
# Asset Schemas
# =========================

class AssetResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    file_size: int
    summary: Optional[str] = None
    expiry_date: Optional[str] = None

    class Config:
        from_attributes = True


# =========================
# Chat Schemas
# =========================

class ChatRequest(BaseModel):
    question: str