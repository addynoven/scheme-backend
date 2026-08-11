from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.benefit import BenefitCreate, BenefitResponse
from app.schemas.eligibility_rule import (
    EligibilityRuleCreate,
    EligibilityRuleResponse,
)
from app.schemas.official_source import (
    OfficialSourceCreate,
    OfficialSourceResponse,
)
from app.schemas.required_document import (
    RequiredDocumentCreate,
    RequiredDocumentResponse,
)


class SchemeBase(BaseModel):
    name: str = Field(
        ...,
        examples=["Pradhan Mantri Kisan Samman Nidhi"],
        description="Official title of the government scheme",
    )
    slug: str = Field(
        ...,
        examples=["pm-kisan"],
        description="Unique URL-friendly slug",
    )
    category: str = Field(
        "General",
        examples=["Agriculture"],
        description="Sector category (Agriculture, Healthcare, Education, Housing, Women & Child, Social Welfare, Business & Finance, Employment & Skills)",
    )
    tags: str | None = Field(
        None,
        examples=["farmer, agriculture, crop, fertilizer, income support, rural"],
        description="Comma-separated searchable keywords, life situations, and citizen problems",
    )
    ministry: str = Field(
        ...,
        examples=["Ministry of Agriculture and Farmers Welfare"],
        description="Governing Central/State Ministry",
    )
    description: str = Field(
        ...,
        examples=["Direct income support of ₹6,000 per year paid in three equal installments."],
        description="Comprehensive summary of scheme objective and scope",
    )
    status: str = Field(
        "active",
        examples=["active"],
        description="Current status ('active', 'draft', 'archived')",
    )
    application_url: str | None = Field(
        None,
        examples=["https://pmkisan.gov.in"],
        description="Direct URL to online application portal",
    )
    official_website: str | None = Field(
        None,
        examples=["https://pmkisan.gov.in"],
        description="Official portal information URL",
    )
    launch_date: date | None = Field(
        None,
        examples=["2019-02-24"],
        description="Official launch date",
    )


class SchemeCreate(SchemeBase):
    benefits: list[BenefitCreate] = []
    eligibility_rules: list[EligibilityRuleCreate] = []
    required_documents: list[RequiredDocumentCreate] = []
    official_sources: list[OfficialSourceCreate] = []


class SchemeUpdate(BaseModel):
    name: str | None = Field(None, examples=["PM Kisan Samman Nidhi"])
    slug: str | None = Field(None, examples=["pm-kisan"])
    category: str | None = Field(None, examples=["Agriculture"])
    tags: str | None = Field(None, examples=["farmer, crop, fertilizer"])
    ministry: str | None = Field(None, examples=["Ministry of Agriculture"])
    description: str | None = Field(None, examples=["Updated description..."])
    status: str | None = Field(None, examples=["active"])
    application_url: str | None = Field(None, examples=["https://pmkisan.gov.in"])
    official_website: str | None = Field(None, examples=["https://pmkisan.gov.in"])
    launch_date: date | None = Field(None, examples=["2019-02-24"])


class SchemeResponse(SchemeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SchemeDetailResponse(SchemeResponse):
    benefits: list[BenefitResponse] = []
    eligibility_rules: list[EligibilityRuleResponse] = []
    required_documents: list[RequiredDocumentResponse] = []
    official_sources: list[OfficialSourceResponse] = []


class CategoryCount(BaseModel):
    category: str = Field(..., examples=["Agriculture"])
    count: int = Field(..., examples=[4])


class CategoryListResponse(BaseModel):
    categories: list[CategoryCount]