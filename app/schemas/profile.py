from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field


class ProfileBase(BaseModel):
    full_name: str = Field(
        ...,
        examples=["Ramesh Chandra Patel"],
        description="Full legal name of citizen",
    )
    date_of_birth: date = Field(
        ...,
        examples=["1979-05-15"],
        description="Date of birth in YYYY-MM-DD format",
    )
    gender: str = Field(
        ...,
        examples=["male"],
        description="Gender (male, female, transgender, other)",
    )
    state: str = Field(
        ...,
        examples=["Madhya Pradesh"],
        description="State of permanent residency",
    )
    district: str = Field(
        ...,
        examples=["Sehore"],
        description="District of residency",
    )
    annual_income: int = Field(
        0,
        ge=0,
        examples=[120000],
        description="Annual family income in Indian Rupees (INR)",
    )
    occupation: str = Field(
        ...,
        examples=["farmer"],
        description="Primary occupation (farmer, artisan, student, retired, self-employed, etc.)",
    )


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(None, examples=["Ramesh Chandra Patel"])
    date_of_birth: date | None = Field(None, examples=["1979-05-15"])
    gender: str | None = Field(None, examples=["male"])
    state: str | None = Field(None, examples=["Madhya Pradesh"])
    district: str | None = Field(None, examples=["Sehore"])
    annual_income: int | None = Field(None, ge=0, examples=[120000])
    occupation: str | None = Field(None, examples=["farmer"])


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)