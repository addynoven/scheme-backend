from datetime import date
from typing import Any
from pydantic import BaseModel, Field


class EligibilityCheckRequest(BaseModel):
    date_of_birth: date | None = Field(
        None,
        examples=["1985-06-20"],
        description="Date of birth in YYYY-MM-DD format (used to compute age)",
    )
    age: int | None = Field(
        None,
        ge=0,
        le=125,
        examples=[40],
        description="Citizen age in years (alternative to date_of_birth)",
    )
    gender: str | None = Field(
        None,
        examples=["female"],
        description="Gender of applicant (female, male, other)",
    )
    state: str | None = Field(
        None,
        examples=["Maharashtra"],
        description="State of residency",
    )
    district: str | None = Field(
        None,
        examples=["Pune"],
        description="District of residency",
    )
    annual_income: int | None = Field(
        None,
        ge=0,
        examples=[120000],
        description="Annual family income in INR",
    )
    occupation: str | None = Field(
        None,
        examples=["farmer"],
        description="Primary occupation or trade",
    )
    caste_category: str | None = Field(
        None,
        examples=["General", "OBC", "SC", "ST", "EWS"],
        description="Social / caste reservation category",
    )
    is_differently_abled: bool | None = Field(
        None,
        examples=[False],
        description="Whether applicant is a person with disability (Divyangjan)",
    )
    marital_status: str | None = Field(
        None,
        examples=["Single", "Married", "Widowed / Single Mother"],
        description="Marital status of applicant",
    )
    residence_area: str | None = Field(
        None,
        examples=["Rural", "Urban"],
        description="Area of residence (Rural / Gramin vs Urban / Nagar)",
    )
    has_land: bool | None = Field(
        None,
        examples=[True],
        description="Whether applicant or household owns agricultural land",
    )


class CriterionVerdict(BaseModel):
    field: str = Field(..., examples=["annual_income"])
    criterion_title: str = Field(..., examples=["Annual Family Income"])
    status: str = Field(..., examples=["passed"], description="'passed' | 'failed' | 'missing_info'")
    your_value: Any = Field(..., examples=["₹120,000"])
    required_condition: str = Field(..., examples=["Maximum ₹200,000 per year"])
    reason: str = Field(
        ...,
        examples=["Your annual income (₹120,000) is within the allowable limit (Maximum ₹200,000 per year)."],
    )


class SchemeExplanation(BaseModel):
    scheme_id: int = Field(..., examples=[1])
    scheme_name: str = Field(..., examples=["PM-Kisan"])
    scheme_slug: str = Field(..., examples=["pm-kisan"])
    state: str | None = Field(default="ALL_INDIA", examples=["ALL_INDIA"])
    ministry: str = Field(..., examples=["Ministry of Agriculture and Farmers Welfare"])
    description: str = Field(..., examples=["Direct income support for farmers."])
    status: str = Field(..., examples=["eligible"], description="'eligible' | 'nearly_eligible' | 'ineligible'")
    is_eligible: bool = Field(..., examples=[True])
    match_percentage: float = Field(..., examples=[100.0])
    criteria_passed: int = Field(..., examples=[2])
    criteria_total: int = Field(..., examples=[2])
    summary_reason: str = Field(
        ...,
        examples=["You meet all 2 eligibility criteria for this scheme."],
    )
    passed_criteria: list[CriterionVerdict] = Field(default_factory=list)
    failed_criteria: list[CriterionVerdict] = Field(default_factory=list)
    benefits_summary: list[str] = Field(default_factory=list)
    application_url: str | None = Field(None, examples=["https://pmkisan.gov.in"])


class EligibilityReportResponse(BaseModel):
    total_evaluated: int = Field(..., examples=[12])
    eligible_count: int = Field(..., examples=[4])
    nearly_eligible_count: int = Field(..., examples=[3])
    ineligible_count: int = Field(..., examples=[5])
    eligible_schemes: list[SchemeExplanation] = Field(default_factory=list)
    nearly_eligible_schemes: list[SchemeExplanation] = Field(default_factory=list)
    ineligible_schemes: list[SchemeExplanation] = Field(default_factory=list)
