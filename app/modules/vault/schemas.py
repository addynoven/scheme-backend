from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class UserDocumentResponse(BaseModel):
    id: int = Field(..., examples=[1])
    user_id: int = Field(..., examples=[42])
    document_type: str = Field(..., examples=["Aadhaar Card"], description="Type of document in vault")
    document_number_masked: str | None = Field(None, examples=["XXXX-XXXX-4532"], description="Masked identifier")
    file_name: str = Field(..., examples=["aadhaar_front_back.pdf"])
    file_size_bytes: int = Field(..., examples=[245800], description="File size in bytes")
    mime_type: str = Field(..., examples=["application/pdf"])
    is_verified: bool = Field(False, examples=[True], description="Whether document is verified by DigiLocker/Admin")
    download_url: str | None = Field(
        None,
        examples=["https://localhost:9000/scheme-documents/vault/user_42/aadhaar.pdf?..."],
        description="Secure time-limited presigned download URL (valid for 1 hour)",
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentReadinessItem(BaseModel):
    document_name: str = Field(..., examples=["Aadhaar Card"])
    description: str | None = Field(None, examples=["Mandatory identity proof"])
    is_mandatory: bool = Field(..., examples=[True])
    status: str = Field(..., examples=["available"], description="'available' | 'missing'")
    matched_vault_document_id: int | None = Field(None, examples=[1])
    matched_vault_document_name: str | None = Field(None, examples=["aadhaar_front_back.pdf"])


class SchemeDocumentReadinessResponse(BaseModel):
    scheme_id: int = Field(..., examples=[1])
    scheme_name: str = Field(..., examples=["Pradhan Mantri Kisan Samman Nidhi"])
    scheme_slug: str = Field(..., examples=["pm-kisan"])
    is_ready_to_apply: bool = Field(..., examples=[False], description="True if 100% of mandatory documents are uploaded")
    readiness_percentage: float = Field(..., examples=[66.7], description="Percentage of mandatory documents ready")
    mandatory_total: int = Field(..., examples=[3])
    mandatory_available: int = Field(..., examples=[2])
    optional_total: int = Field(..., examples=[1])
    optional_available: int = Field(..., examples=[0])
    checklist: list[DocumentReadinessItem] = []
    summary: str = Field(
        ...,
        examples=["You have 2/3 mandatory documents ready. Please upload the remaining 1 document(s) to complete your application."],
    )


# --- V2.0 Multimodal Vision Fact Extraction & Verification Schemas ---


class ExtractedDocumentFacts(BaseModel):
    full_name: str | None = Field(None, examples=["Ramesh Kumar Patel"])
    date_of_birth: str | None = Field(None, examples=["1985-06-20"], description="ISO format YYYY-MM-DD")
    age: int | None = Field(None, examples=[41])
    gender: str | None = Field(None, examples=["male"])
    state: str | None = Field(None, examples=["Madhya Pradesh"])
    district: str | None = Field(None, examples=["Sehore"])
    annual_income: int | None = Field(None, examples=[120000], description="Normalized annual income in INR")
    occupation: str | None = Field(None, examples=["farmer"])
    caste_category: str | None = Field(None, examples=["OBC"])
    has_land: bool | None = Field(None, examples=[True])
    is_differently_abled: bool | None = Field(None, examples=[False])
    document_number_masked: str | None = Field(None, examples=["XXXX-XXXX-4532"])


class ExtractedDocumentFactsResponse(BaseModel):
    status: str = Field("success", examples=["success", "fallback"])
    document_id: int | None = None
    detected_document_type: str = Field(..., examples=["PAN Card", "Aadhaar Card", "Income Certificate"])
    confidence_score: float = Field(..., examples=[0.96], ge=0.0, le=1.0)
    evidence_summary: str = Field(..., examples=["Verified Indian Income Tax Permanent Account Number card."])
    extracted_facts: ExtractedDocumentFacts
    applicable_profile_fields: list[str] = Field(default_factory=list, examples=[["full_name", "date_of_birth"]])


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
    status: str = "synced"
    synced_fields: list[str] = []
    message: str = "Profile successfully updated from verified document facts."
    profile: dict[str, Any] = {}
