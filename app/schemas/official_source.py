from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OfficialSourceBase(BaseModel):
    title: str
    url: str
    source_type: str


class OfficialSourceCreate(OfficialSourceBase):
    pass


class OfficialSourceUpdate(BaseModel):
    title: str | None = None
    url: str | None = None
    source_type: str | None = None


class OfficialSourceResponse(OfficialSourceBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)