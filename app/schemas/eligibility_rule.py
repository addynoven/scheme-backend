from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EligibilityRuleBase(BaseModel):
    field_name: str
    operator: str
    rule_value: str


class EligibilityRuleCreate(EligibilityRuleBase):
    pass


class EligibilityRuleUpdate(BaseModel):
    field_name: str | None = None
    operator: str | None = None
    rule_value: str | None = None


class EligibilityRuleResponse(EligibilityRuleBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)