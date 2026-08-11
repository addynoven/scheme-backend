from datetime import datetime
from pydantic import BaseModel

class EligibilityRuleCreate(BaseModel):
    field_name: str
    operator: str
    rule_value: str


class EligibilityRuleResponse(EligibilityRuleCreate):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    } 