from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SchemeCreate(BaseModel):
    name: str
    ministry: str
    description: str

class SchemeResponse(SchemeCreate):
    id: int
    created_at: datetime
    updated_at: datetime

    # Modern Pydantic v2 syntax using ConfigDict
    model_config = ConfigDict(from_attributes=True)