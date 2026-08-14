from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# --- Profile Schemas ---

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
    caste_category: str | None = Field(None, examples=["OBC"])
    is_differently_abled: bool | None = Field(None, examples=[False])
    marital_status: str | None = Field(None, examples=["Married"])
    residence_area: str | None = Field(None, examples=["Rural"])
    has_land: bool | None = Field(None, examples=[True])


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
    caste_category: str | None = None
    is_differently_abled: bool | None = None
    marital_status: str | None = None
    residence_area: str | None = None
    has_land: bool | None = None


class ProfileResponse(ProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- User & Auth Schemas ---

class UserBase(BaseModel):
    email: EmailStr
    phone: str
    role: str = "citizen"


class UserCreate(UserBase):
    password: str = "ChangeMe123!"


class UserRegister(BaseModel):
    email: EmailStr = Field(
        ...,
        examples=["citizen.ramesh@example.com"],
        description="Valid email address of the citizen",
    )
    phone: str = Field(
        ...,
        examples=["+919876543210"],
        description="Mobile number with country code",
    )
    password: str = Field(
        ...,
        min_length=8,
        examples=["SecurePass123!"],
        description="Strong password (minimum 8 characters)",
    )


UserRegisterRequest = UserRegister


class UserLogin(BaseModel):
    email: EmailStr = Field(
        ...,
        examples=["citizen.ramesh@example.com"],
        description="Registered email address",
    )
    password: str = Field(
        ...,
        examples=["SecurePass123!"],
        description="Account password",
    )


UserLoginRequest = UserLogin


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None
    role: str | None = None
    is_verified: bool | None = None


class UserResponse(UserBase):
    id: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    profile: ProfileResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class UserWithProfileResponse(UserResponse):
    profile: ProfileResponse | None = None


class UserRoleUpdate(BaseModel):
    role: str


class TokenResponse(BaseModel):
    access_token: str = Field(
        ...,
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
        description="Short-lived JWT Access Token (30 minutes)",
    )
    refresh_token: str = Field(
        ...,
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
        description="Long-lived JWT Refresh Token (7 days)",
    )
    token_type: str = Field(
        "bearer",
        examples=["bearer"],
        description="Token type header prefix",
    )
    user: UserResponse | None = None


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(
        ...,
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
        description="Valid refresh token obtained from login",
    )


# --- Citizen Facts & Provenance Schemas ---

class CitizenFactResponse(BaseModel):
    id: int
    user_id: int
    fact_key: str = Field(..., description="Fact identifier e.g. 'annual_income', 'date_of_birth', 'gender'")
    fact_value: str = Field(..., description="Stringified verified value")
    source_document_id: int | None = Field(None, description="Linked document in vault if verified via OCR/upload")
    verified_by_user_id: int | None = Field(None, description="User ID who confirmed this fact")
    verified_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CitizenFactsAuditResponse(BaseModel):
    user_id: int
    total_facts: int
    verified_facts: dict[str, str] = Field(..., description="Consolidated dictionary of latest verified facts")
    fact_history: list[CitizenFactResponse] = Field(..., description="Full immutable audit trail of all verified facts")

