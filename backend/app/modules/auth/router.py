from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin_user, get_current_user, get_db
from app.core.exceptions import PermissionDeniedError, ProfileNotFoundError, UserNotFoundError
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    CitizenFactsAuditResponse,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    RefreshTokenRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
    UserWithProfileResponse,
)
from app.modules.auth.service import (
    authenticate_user,
    create_or_update_profile,
    create_user,
    delete_profile,
    delete_user,
    generate_tokens,
    get_citizen_facts_audit,
    get_profile_by_user_id,
    get_user_by_id,
    list_users,
    refresh_access_token,
    register_user,
    update_profile,
    update_user,
)
from app.core.pagination import PaginatedResponse

router = APIRouter(tags=["Auth & Users"])


# --- Authentication Endpoints ---


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new citizen account",
)
def register_endpoint(
    payload: UserRegister,
    db: Session = Depends(get_db),
):
    return create_user(db=db, payload=payload)


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Log in and obtain JWT tokens",
)
def login_endpoint(
    payload: UserLogin,
    db: Session = Depends(get_db),
):
    user = authenticate_user(db=db, payload=payload)
    return generate_tokens(db=db, user=user)


@router.post(
    "/auth/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
def refresh_token_endpoint(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    return refresh_access_token(db=db, refresh_token_str=payload.refresh_token)


@router.get(
    "/auth/me",
    response_model=UserWithProfileResponse,
    summary="Get current authenticated citizen",
)
def get_current_auth_user_endpoint(
    current_user: User = Depends(get_current_user),
):
    return current_user


# --- Current Citizen Profile Endpoints (/users/me/...) ---


@router.get(
    "/users/me",
    response_model=UserWithProfileResponse,
    summary="Get current user details with profile",
)
def get_my_user_endpoint(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get(
    "/users/me/profile",
    response_model=ProfileResponse,
    summary="Get current citizen profile",
)
def get_my_profile_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db=db, user_id=current_user.id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{current_user.id}")
    return profile


@router.post(
    "/users/me/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update current citizen profile",
)
def create_or_update_my_profile_endpoint(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_or_update_profile(
        db=db, user_id=current_user.id, payload=payload
    )


@router.patch(
    "/users/me/profile",
    response_model=ProfileResponse,
    summary="Partially update citizen profile",
)
def update_my_profile_endpoint(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(
        db=db, profile_id=current_user.profile.id if current_user.profile else 0, payload=payload
    ) if current_user.profile else create_or_update_profile(db=db, user_id=current_user.id, payload=payload)


@router.delete(
    "/users/me/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete citizen profile",
)
def delete_my_profile_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_profile(db=db, profile_id=current_user.profile.id if current_user.profile else 0)
    return None


@router.get(
    "/users/me/facts",
    response_model=CitizenFactsAuditResponse,
    summary="Get citizen verified facts and provenance audit trail",
    description="Returns the consolidated latest verified facts dictionary and full historical audit trail with linked source document IDs.",
    response_description="Consolidated verified facts and full immutable audit history",
)
def get_my_verified_facts_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_citizen_facts_audit(db=db, user_id=current_user.id)


# --- General User Management Endpoints ---


def _verify_user_owner_or_admin(target_user_id: int, current_user: User) -> None:
    if current_user.id != target_user_id and current_user.role != "admin":
        raise PermissionDeniedError("Access forbidden: you do not have permission to access or modify this user")


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user account (Admin/Internal)",
)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    return create_user(db=db, payload=payload)


@router.get(
    "/users",
    response_model=PaginatedResponse[UserWithProfileResponse],
    summary="List users (Admin)",
)
def list_users_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    items, total = list_users(db=db, skip=skip, limit=limit)
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/users/{user_id}",
    response_model=UserWithProfileResponse,
    summary="Get user by ID",
)
def get_user_by_id_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError(user_id)
    return user


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Update user by ID",
)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    return update_user(db=db, user_id=user_id, payload=payload)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user by ID (Admin)",
)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    delete_user(db=db, user_id=user_id)
    return None


@router.get(
    "/users/{user_id}/profile",
    response_model=ProfileResponse,
    summary="Get profile by user ID",
)
def get_user_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    profile = get_profile_by_user_id(db=db, user_id=user_id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")
    return profile


@router.post(
    "/users/{user_id}/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update profile by user ID",
)
def create_or_update_user_profile_endpoint(
    user_id: int,
    payload: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    return create_or_update_profile(
        db=db, user_id=user_id, payload=payload
    )


@router.patch(
    "/users/{user_id}/profile",
    response_model=ProfileResponse,
    summary="Update profile by user ID",
)
def update_user_profile_endpoint(
    user_id: int,
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    user = get_user_by_id(db, user_id)
    if not user or not user.profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")
    return update_profile(db=db, profile_id=user.profile.id, payload=payload)


@router.delete(
    "/users/{user_id}/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete profile by user ID",
)
def delete_user_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _verify_user_owner_or_admin(user_id, current_user)
    user = get_user_by_id(db, user_id)
    if not user or not user.profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")
    delete_profile(db=db, profile_id=user.profile.id)
    return None
