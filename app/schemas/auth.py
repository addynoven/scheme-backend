from pydantic import BaseModel, EmailStr, Field


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


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(
        ...,
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
        description="Valid refresh token obtained from login",
    )
