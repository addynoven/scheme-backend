from pydantic import BaseModel, Field


class ExtractedDocumentFacts(BaseModel):
    full_name: str | None = Field(None, description="Full citizen name extracted from document")
    date_of_birth: str | None = Field(None, description="Date of birth in YYYY-MM-DD format if present")
    age: int | None = Field(None, description="Calculated or stated age if present")
    gender: str | None = Field(None, description="Gender: male / female / other")
    state: str | None = Field(None, description="State of residence if present on document")
    district: str | None = Field(None, description="District if present on document")
    annual_income: int | None = Field(None, description="Annual income in INR (only on income certificates)")
    occupation: str | None = Field(None, description="Stated occupation if present")
    caste_category: str | None = Field(None, description="Caste category: General / OBC / SC / ST / EWS")
    has_land: bool | None = Field(None, description="Whether citizen owns agricultural land (e.g. 7/12 land records)")
    is_differently_abled: bool | None = Field(None, description="Disability indicator if on disability certificate")
    document_number_masked: str | None = Field(None, description="Masked document number e.g. 'XXXX-XXXX-4532'")


class ExtractedDocumentFactsResponse(BaseModel):
    status: str = Field("success", description="'success' or 'error'")
    document_id: int | None = Field(None, description="Vault document ID if associated with a saved document")
    detected_document_type: str = Field(..., description="Detected type e.g. 'Aadhaar Card', 'PAN Card', 'Income Certificate'")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score between 0.0 and 1.0")
    evidence_summary: str = Field(..., description="Human-readable explanation of why these facts were detected")
    extracted_facts: ExtractedDocumentFacts = Field(..., description="Structured facts extracted strictly from document content")
    applicable_profile_fields: list[str] = Field(..., description="List of profile fields that this document is valid to update")
