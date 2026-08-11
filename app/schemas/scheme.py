from datetime import date, datetime

from pydantic import BaseModel


class SchemeCreate(BaseModel):
    name: str
    slug: str
    ministry: str
    description: str
    status: str
    application_url: str | None = None
    official_website: str | None = None
    launch_date: date | None = None


class SchemeResponse(SchemeCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }