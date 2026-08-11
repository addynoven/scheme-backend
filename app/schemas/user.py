from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    phone: str


class UserResponse(UserCreate):
    id: int
    is_verified: bool

    model_config = {
        "from_attributes": True
    }