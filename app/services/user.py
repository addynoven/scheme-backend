from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import DuplicateEntityError, UserNotFoundError
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


def create_user(db: Session, payload: UserCreate) -> User:
    existing = db.scalar(
        select(User).where(
            (User.email == payload.email) | (User.phone == payload.phone)
        )
    )
    if existing:
        if existing.email == payload.email:
            raise DuplicateEntityError(
                f"User with email '{payload.email}' already exists"
            )
        raise DuplicateEntityError(
            f"User with phone '{payload.phone}' already exists"
        )

    data = payload.model_dump()
    data["hashed_password"] = hash_password(data.pop("password"))

    user = User(**data)
    db.add(user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(user)
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    stmt = (
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.profile))
    )
    return db.scalar(stmt)


def get_user_by_email(db: Session, email: str) -> User | None:
    stmt = (
        select(User)
        .where(User.email == email)
        .options(selectinload(User.profile))
    )
    return db.scalar(stmt)


def get_user_by_phone(db: Session, phone: str) -> User | None:
    stmt = (
        select(User)
        .where(User.phone == phone)
        .options(selectinload(User.profile))
    )
    return db.scalar(stmt)


def list_users(
    db: Session, skip: int = 0, limit: int = 20
) -> tuple[list[User], int]:
    count_stmt = select(func.count(User.id))
    total = db.scalar(count_stmt) or 0

    stmt = (
        select(User)
        .offset(skip)
        .limit(limit)
        .order_by(User.id.desc())
        .options(selectinload(User.profile))
    )
    items = list(db.scalars(stmt).all())
    return items, total


def update_user(
    db: Session, user_id: int, payload: UserUpdate
) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise UserNotFoundError(user_id)

    update_data = payload.model_dump(exclude_unset=True)

    if "email" in update_data and update_data["email"] != user.email:
        existing = get_user_by_email(db, update_data["email"])
        if existing and existing.id != user_id:
            raise DuplicateEntityError(
                f"User with email '{update_data['email']}' already exists"
            )

    if "phone" in update_data and update_data["phone"] != user.phone:
        existing = get_user_by_phone(db, update_data["phone"])
        if existing and existing.id != user_id:
            raise DuplicateEntityError(
                f"User with phone '{update_data['phone']}' already exists"
            )

    if "password" in update_data:
        new_pwd = update_data.pop("password")
        if new_pwd:
            update_data["hashed_password"] = hash_password(new_pwd)

    for field, value in update_data.items():
        setattr(user, field, value)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise UserNotFoundError(user_id)

    db.delete(user)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return True
