from datetime import date, datetime

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    state: str
    district: str
    annual_income: int
    occupation: str


class ProfileResponse(ProfileCreate):
    id: int
    user_id: int

    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }