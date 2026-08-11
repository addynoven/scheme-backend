from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BenefitBase(BaseModel):
    title: str
    description: str


class BenefitCreate(BenefitBase):
    pass


class BenefitUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class BenefitResponse(BenefitBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)