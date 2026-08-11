from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
)
from app.schemas.user import UserResponse, UserWithProfileResponse
from app.services.auth import (
    authenticate_user,
    generate_tokens,
    refresh_access_token,
    register,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account",
    description="Registers a citizen with email, phone, and password. Hashes password securely using bcrypt and creates an unverified citizen user.",
    response_description="Created citizen user record (without password)",
)
def register_endpoint(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    return register(db=db, payload=payload)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Log in and obtain JWT tokens",
    description="Authenticates citizen email and password. Returns a short-lived JWT Access Token (30 min) and a long-lived Refresh Token (7 days).",
    response_description="Access token, refresh token, and token type",
)
def login_endpoint(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db=db, payload=payload)
    return generate_tokens(user)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Issues a fresh JWT Access Token and Refresh Token pair using a valid, non-expired refresh token.",
    response_description="New token pair",
)
def refresh_token_endpoint(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return refresh_access_token(db=db, refresh_token=payload.refresh_token)


@router.get(
    "/me",
    response_model=UserWithProfileResponse,
    summary="Get current authenticated citizen",
    description="Returns the profile and account details of the currently authenticated citizen.",
    response_description="Current citizen user details and profile",
)
def get_current_user_endpoint(
    current_user: User = Depends(get_current_user),
):
    return current_user
