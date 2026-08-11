from datetime import datetime
from pydantic import BaseModel

class RequiredDocumentCreate(BaseModel):
    document_name: str
    description: str | None = None
    is_mandatory: bool = True


class RequiredDocumentResponse(RequiredDocumentCreate):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }