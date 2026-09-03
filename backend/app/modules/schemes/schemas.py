from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


# --- Benefit Schemas ---

class BenefitBase(BaseModel):
    title: str = Field(..., examples=["Direct Financial Transfer"])
    description: str = Field(..., examples=["₹6,000 per year paid in 3 installments."])


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


# --- Eligibility Rule Schemas ---

class EligibilityRuleBase(BaseModel):
    field_name: str = Field(..., examples=["annual_income"])
    operator: str = Field(..., examples=["lte"])
    rule_value: str = Field(..., examples=["200000"])


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


# --- Required Document Schemas ---

class RequiredDocumentBase(BaseModel):
    document_name: str = Field(..., examples=["Aadhaar Card"])
    is_mandatory: bool = Field(default=True, examples=[True])
    description: str | None = Field(None, examples=["Mandatory ID verification."])


class RequiredDocumentCreate(RequiredDocumentBase):
    pass


class RequiredDocumentUpdate(BaseModel):
    document_name: str | None = None
    is_mandatory: bool | None = None
    description: str | None = None


class RequiredDocumentResponse(RequiredDocumentBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Official Source Schemas ---

class OfficialSourceBase(BaseModel):
    title: str = Field(..., examples=["PM Kisan Portal"])
    url: str = Field(..., examples=["https://pmkisan.gov.in"])
    source_type: str = Field(default="portal", examples=["portal"])


class OfficialSourceCreate(OfficialSourceBase):
    pass


class OfficialSourceUpdate(BaseModel):
    title: str | None = None
    url: str | None = None
    source_type: str | None = None


class OfficialSourceResponse(OfficialSourceBase):
    id: int
    scheme_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Scheme Core Schemas ---

class SchemeBase(BaseModel):
    name: str = Field(..., examples=["Pradhan Mantri Kisan Samman Nidhi"])
    slug: str = Field(..., examples=["pm-kisan"])
    state: str = Field(default="ALL_INDIA", examples=["ALL_INDIA"])
    category: str = Field(default="General", examples=["Agriculture"])
    tags: str | None = Field(None, examples=["farmer, agriculture, crop, dbt"])
    ministry: str = Field(..., examples=["Ministry of Agriculture and Farmers Welfare"])
    description: str = Field(..., examples=["Direct income support for farmers."])
    status: str = Field(default="active", examples=["active"])
    application_url: str | None = Field(None, examples=["https://pmkisan.gov.in"])
    official_website: str | None = Field(None, examples=["https://pmkisan.gov.in"])
    launch_date: date | None = Field(None, examples=["2019-02-01"])


class SchemeCreate(SchemeBase):
    benefits: list[BenefitCreate] = Field(default_factory=list)
    eligibility_rules: list[EligibilityRuleCreate] = Field(default_factory=list)
    required_documents: list[RequiredDocumentCreate] = Field(default_factory=list)
    official_sources: list[OfficialSourceCreate] = Field(default_factory=list)


class SchemeUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    state: str | None = None
    category: str | None = None
    tags: str | None = None
    ministry: str | None = None
    description: str | None = None
    status: str | None = None
    application_url: str | None = None
    official_website: str | None = None
    launch_date: date | None = None


class SchemeDetailResponse(SchemeBase):
    id: int = Field(..., examples=[1])
    created_at: datetime
    updated_at: datetime
    benefits: list[BenefitResponse] = Field(default_factory=list)
    eligibility_rules: list[EligibilityRuleResponse] = Field(default_factory=list)
    required_documents: list[RequiredDocumentResponse] = Field(default_factory=list)
    official_sources: list[OfficialSourceResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


SchemeResponse = SchemeDetailResponse


class CategoryCount(BaseModel):
    category: str
    count: int


class CategoryListResponse(BaseModel):
    categories: list[CategoryCount]
    total_categories: int | None = None
    total_schemes: int | None = None


# --- Scheme Browse & Verification Schemas ---

class SchemeBrowseItemResponse(SchemeDetailResponse):
    publication_state: str = Field(default="published", examples=["published"])
    source_freshness: str = Field(default="fresh", examples=["fresh"])
    knowledge_md: str | None = Field(None, description="Canonical OKF Markdown documentation if include_knowledge_md=true")
    verification_status: str = Field(default="DATABASE_RECORD_ONLY", description="Verification label e.g. VERIFIED_CANONICAL_RECORD or DATABASE_RECORD_ONLY")


class SchemeBrowsePaginatedResponse(BaseModel):
    items: list[SchemeBrowseItemResponse] = Field(default_factory=list)
    total: int
    skip: int = 0
    limit: int = 20
    filters_applied: dict[str, str | int | float | bool] = Field(default_factory=dict)