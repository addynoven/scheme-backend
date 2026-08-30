from datetime import date, datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class HouseholdMemberCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    relationship: str = Field(..., description="daughter, son, spouse, mother, father, dependent, etc.")
    age: int = Field(..., ge=0, le=120)
    date_of_birth: date | None = None
    gender: str = Field(..., description="female, male, other")
    occupation: str | None = "unemployed"
    caste_category: str | None = "General"
    annual_income: float | None = 0.0
    is_student: bool = False
    is_disabled: bool = False
    aadhaar_last_four: str | None = None


class HouseholdMemberUpdate(BaseModel):
    full_name: str | None = None
    relationship: str | None = None
    age: int | None = None
    date_of_birth: date | None = None
    gender: str | None = None
    occupation: str | None = None
    caste_category: str | None = None
    annual_income: float | None = None
    is_student: bool | None = None
    is_disabled: bool | None = None
    aadhaar_last_four: str | None = None


class HouseholdMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    primary_user_id: int
    citizen_uid: str
    member_uid: str
    household_uid: str
    full_name: str
    relationship: str
    life_stage: str  # MINOR, ADULT, SENIOR
    verification_status: str  # UNVERIFIED, PENDING_DOCS, DOCUMENT_VERIFIED
    date_of_birth: date | None = None
    age: int
    gender: str
    occupation: str | None = None
    caste_category: str | None = "General"
    annual_income: float | None = 0.0
    is_student: bool = False
    is_disabled: bool = False
    aadhaar_last_four: str | None = None
    created_at: datetime
    updated_at: datetime


class MemberEligibilityReport(BaseModel):
    member_id: int
    citizen_uid: str
    member_uid: str
    full_name: str
    relationship: str
    life_stage: str
    verification_status: str
    age: int
    gender: str
    eligible_schemes_count: int
    eligible_schemes: list[dict[str, Any]] = Field(default_factory=list)


class FamilyEligibilityResponse(BaseModel):
    household_uid: str
    total_family_members: int
    total_collective_schemes: int
    family_members_reports: list[MemberEligibilityReport]
