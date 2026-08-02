from pydantic import BaseModel, EmailStr
from typing import Optional

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


class AssetResponse(BaseModel):
    id: int
    file_name: str
    file_type: str
    file_size: int
    summary: Optional[str] = None

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    question: str