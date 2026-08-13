from datetime import datetime
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
