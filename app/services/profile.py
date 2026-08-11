from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ProfileNotFoundError, UserNotFoundError
from app.models.profile import Profile
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileUpdate


def get_profile_by_user_id(db: Session, user_id: int) -> Profile | None:
    stmt = select(Profile).where(Profile.user_id == user_id)
    return db.scalar(stmt)


def get_profile_by_id(db: Session, profile_id: int) -> Profile | None:
    stmt = select(Profile).where(Profile.id == profile_id)
    return db.scalar(stmt)


def create_or_update_profile(
    db: Session, user_id: int, payload: ProfileCreate
) -> Profile:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise UserNotFoundError(user_id)

    profile = get_profile_by_user_id(db, user_id)
    if profile:
        for field, value in payload.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = Profile(user_id=user_id, **payload.model_dump())
        db.add(profile)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(profile)
    return profile


def update_profile(
    db: Session, user_id: int, payload: ProfileUpdate
) -> Profile:
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(profile)
    return profile


def delete_profile(db: Session, user_id: int) -> bool:
    profile = get_profile_by_user_id(db, user_id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")

    db.delete(profile)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True
