from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.profile import ProfileResponse


class UserBase(BaseModel):
    email: EmailStr
    phone: str
    role: str = "citizen"


class UserCreate(UserBase):
    password: str = "ChangeMe123!"


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None
    role: str | None = None
    is_verified: bool | None = None


class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserWithProfileResponse(UserResponse):
    profile: ProfileResponse | None = None


class UserRoleUpdate(BaseModel):
    role: str