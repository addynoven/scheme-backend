from datetime import datetime
from pydantic import BaseModel, ConfigDict


class RequiredDocumentBase(BaseModel):
    document_name: str
    description: str | None = None
    is_mandatory: bool = True


class RequiredDocumentCreate(RequiredDocumentBase):
    pass


class RequiredDocumentUpdate(BaseModel):
    document_name: str | None = None
    description: str | None = None
    is_mandatory: bool | None = None


class RequiredDocumentResponse(RequiredDocumentBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)