from pydantic import BaseModel, Field, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password (min 6 char)")
    
class UserLogin(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., description="User's password")

class UserOut(BaseModel):
    id: UUID = Field(..., description="User's unique identifier")
    email: str = Field(..., description="User's email address")
    created_date: datetime = Field(..., description="When the account was created")
    is_active: bool = Field(..., description="Whether the account is active")
    
    class Config:
        from_attributes = True

class UserInDB(BaseModel):
    id: UUID
    email: str
    hashed_password: str
    created_date: datetime
    is_active: bool
    
    class Config:
        from_attributes = True