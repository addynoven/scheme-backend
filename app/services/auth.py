from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, InvalidTokenError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import TokenResponse, UserLogin, UserRegister
from app.schemas.user import UserCreate
from app.services.user import create_user, get_user_by_email, get_user_by_id


def register(db: Session, payload: UserRegister) -> User:
    create_payload = UserCreate(
        email=payload.email,
        phone=payload.phone,
        password=payload.password,
    )
    return create_user(db, create_payload)


def authenticate_user(db: Session, payload: UserLogin) -> User:
    user = get_user_by_email(db, payload.email)
    if not user:
        raise AuthenticationError("Invalid email or password")

    if not verify_password(payload.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")

    return user


def generate_tokens(user: User) -> TokenResponse:
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
    )


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise InvalidTokenError("Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise InvalidTokenError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError("Invalid token payload")

    user = get_user_by_id(db, int(user_id))
    if not user:
        raise AuthenticationError("User not found")

    new_access_token = create_access_token(subject=user.id)
    new_refresh_token = create_refresh_token(subject=user.id)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
    )
