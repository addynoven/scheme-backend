from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.exceptions import ProfileNotFoundError, UserNotFoundError
from app.database import get_db
from app.models.user import User
from app.schemas.pagination import PaginatedResponse
from app.schemas.profile import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
)
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    UserWithProfileResponse,
)
from app.services.profile import (
    create_or_update_profile,
    delete_profile,
    get_profile_by_user_id,
    update_profile,
)
from app.services.user import (
    create_user,
    delete_user,
    get_user_by_id,
    list_users,
    update_user,
)

router = APIRouter(prefix="/users", tags=["Users"])


# --- Current Authenticated User & Profile Endpoints ---


@router.get(
    "/me",
    response_model=UserWithProfileResponse,
    summary="Get current user details with profile",
    description="Returns the currently authenticated user's account and profile details.",
    response_description="User account and profile data",
)
def get_my_user_endpoint(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get(
    "/me/profile",
    response_model=ProfileResponse,
    summary="Get current citizen profile",
    description="Returns the demographic, income, location, and occupation details for the logged-in citizen.",
    response_description="Citizen profile details",
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
    "/me/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update current citizen profile",
    description="Creates a new citizen profile or updates the existing one for the authenticated user.",
    response_description="Saved citizen profile",
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
    "/me/profile",
    response_model=ProfileResponse,
    summary="Partially update citizen profile",
    description="Updates specific fields of the citizen's profile (e.g. updating annual income or district).",
    response_description="Updated profile",
)
def update_my_profile_endpoint(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_profile(
        db=db, user_id=current_user.id, payload=payload
    )


@router.delete(
    "/me/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete citizen profile",
    description="Removes the citizen profile for the current user.",
)
def delete_my_profile_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_profile(db=db, user_id=current_user.id)
    return None


# --- General User Management Endpoints ---


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user account (Internal)",
    description="Creates a new user record in the database.",
)
def create_user_endpoint(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    return create_user(db=db, payload=payload)


@router.get(
    "",
    response_model=PaginatedResponse[UserWithProfileResponse],
    summary="List users",
    description="Returns a paginated list of all users and profiles.",
)
def list_users_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = list_users(db=db, skip=skip, limit=limit)
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{user_id}",
    response_model=UserWithProfileResponse,
    summary="Get user by ID",
    description="Returns a specific user and their profile by user ID.",
)
def get_user_by_id_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError(user_id)
    return user


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user by ID",
    description="Updates user email, phone, or password.",
)
def update_user_endpoint(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
):
    return update_user(db=db, user_id=user_id, payload=payload)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user by ID",
    description="Deletes a user and cascades deletion to their profile and document vault.",
)
def delete_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    delete_user(db=db, user_id=user_id)
    return None


@router.get(
    "/{user_id}/profile",
    response_model=ProfileResponse,
    summary="Get profile by user ID",
    description="Returns the profile belonging to a specific user ID.",
)
def get_user_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db=db, user_id=user_id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")
    return profile


@router.post(
    "/{user_id}/profile",
    response_model=ProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Create or update profile by user ID",
)
def create_or_update_user_profile_endpoint(
    user_id: int,
    payload: ProfileCreate,
    db: Session = Depends(get_db),
):
    return create_or_update_profile(
        db=db, user_id=user_id, payload=payload
    )


@router.patch(
    "/{user_id}/profile",
    response_model=ProfileResponse,
    summary="Update profile by user ID",
)
def update_user_profile_endpoint(
    user_id: int,
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
):
    return update_profile(db=db, user_id=user_id, payload=payload)


@router.delete(
    "/{user_id}/profile",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete profile by user ID",
)
def delete_user_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    delete_profile(db=db, user_id=user_id)
    return None
