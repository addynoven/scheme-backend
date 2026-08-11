from datetime import datetime
from pydantic import BaseModel

class BenefitCreate(BaseModel):
    title: str
    description: str


class BenefitResponse(BenefitCreate):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }