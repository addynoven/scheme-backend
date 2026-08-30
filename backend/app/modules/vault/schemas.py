from typing import Any
from pydantic import BaseModel, Field

from app.modules.ocr.schemas import (
    ExtractedDocumentFacts,
    ExtractedDocumentFactsResponse,
)


class UserDocumentResponse(BaseModel):
    id: int
    user_id: int
    household_member_id: int | None = None
    citizen_uid: str | None = None
    document_type: str
    document_number_masked: str | None = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    is_verified: bool
    download_url: str | None = None

    class Config:
        from_attributes = True


class DocumentReadinessItem(BaseModel):
    document_name: str
    description: str | None = None
    is_mandatory: bool
    status: str = Field(..., description="'available' if uploaded to vault, 'missing' otherwise")
    matched_vault_document_id: int | None = None
    matched_vault_document_name: str | None = None


class SchemeDocumentReadinessResponse(BaseModel):
    scheme_id: int
    scheme_name: str
    scheme_slug: str
    is_ready_to_apply: bool = Field(..., description="True if 100% mandatory documents are uploaded in citizen's vault")
    readiness_percentage: float = Field(..., ge=0, le=100, description="Percentage of required documents available in vault")
    mandatory_total: int
    mandatory_available: int
    optional_total: int
    optional_available: int
    checklist: list[DocumentReadinessItem]
    summary: str = Field(..., description="Human-friendly readiness breakdown and instructions")


class ConfirmFactsAndSyncProfileRequest(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    state: str | None = None
    district: str | None = None
    annual_income: int | None = None
    occupation: str | None = None
    caste_category: str | None = None
    has_land: bool | None = None
    is_differently_abled: bool | None = None


class ConfirmFactsAndSyncProfileResponse(BaseModel):
    status: str = Field("synced", description="Sync status")
    document_id: int | None = Field(None, description="Vault document ID if associated with a saved document")
    synced_fields: list[str] = Field(..., description="List of profile fields updated in SQL database")
    message: str
    profile: dict[str, Any]
