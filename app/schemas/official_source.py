from datetime import datetime
from pydantic import BaseModel

class OfficialSourceCreate(BaseModel):
    title: str
    url: str
    source_type: str


class OfficialSourceResponse(OfficialSourceCreate):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    } 