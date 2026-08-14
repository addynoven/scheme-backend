from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class HouseholdMemberCreate(BaseModel):
    full_name: str = Field(..., min_length=1)
    relationship: str = Field(..., description="daughter, son, spouse, mother, father, etc.")
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., description="female, male, other")
    occupation: str | None = "unemployed"
    is_student: bool = False
    is_disabled: bool = False


class HouseholdMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    primary_user_id: int
    full_name: str
    relationship: str
    age: int
    gender: str
    occupation: str | None
    is_student: bool
    is_disabled: bool
    created_at: datetime
    updated_at: datetime


class MemberEligibilityReport(BaseModel):
    member_id: int
    full_name: str
    relationship: str
    age: int
    gender: str
    eligible_schemes_count: int
    eligible_schemes: list[dict[str, Any]] = Field(default_factory=list)


class FamilyEligibilityResponse(BaseModel):
    total_family_members: int
    total_collective_schemes: int
    family_members_reports: list[MemberEligibilityReport]
