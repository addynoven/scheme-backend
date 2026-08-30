from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, DuplicateEntityError, UserNotFoundError
from app.core.security import create_access_token, hash_password, verify_password
from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.auth.schemas import (
    ProfileCreate,
    ProfileUpdate,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.scalar(select(User).where(User.id == user_id))


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_user_by_phone(db: Session, phone: str) -> User | None:
    return db.scalar(select(User).where(User.phone == phone))


def register_user(db: Session, payload: UserRegisterRequest) -> TokenResponse:
    if get_user_by_email(db, payload.email):
        raise DuplicateEntityError(f"User with email '{payload.email}' already exists")

    if get_user_by_phone(db, payload.phone):
        raise DuplicateEntityError(f"User with phone '{payload.phone}' already exists")

    from app.core.uid_generator import generate_citizen_uid, generate_household_uid

    user = User(
        citizen_uid=generate_citizen_uid(),
        household_uid=generate_household_uid(),
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role="citizen",
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def authenticate_user(db: Session, payload: UserLoginRequest) -> User:
    user = get_user_by_email(db, payload.email)
    if not user:
        raise AuthenticationError("Invalid email or password")

    if not verify_password(payload.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")

    # Ensure UIDs exist for legacy or seeded accounts
    from app.core.uid_generator import generate_citizen_uid, generate_household_uid
    updated = False
    if not user.citizen_uid:
        user.citizen_uid = generate_citizen_uid()
        updated = True
    if not user.household_uid:
        user.household_uid = generate_household_uid()
        updated = True
    if updated:
        db.commit()
        db.refresh(user)

    return user


register = register_user


def generate_tokens(user: User) -> TokenResponse:
    from app.core.security import create_access_token, create_refresh_token
    access_token = create_access_token(subject=user.id)
    refresh_token = create_refresh_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def refresh_access_token(db: Session, refresh_token: str | None = None, refresh_token_str: str | None = None) -> TokenResponse:
    from app.core.exceptions import InvalidTokenError
    from app.core.security import create_access_token, create_refresh_token, decode_token

    tok = refresh_token or refresh_token_str or ""
    try:
        payload = decode_token(tok)
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
        user=UserResponse.model_validate(user),
    )


def get_user_profile(db: Session, user_id: int) -> Profile | None:
    return db.scalar(select(Profile).where(Profile.user_id == user_id))


get_profile_by_user_id = get_user_profile


def get_profile_by_id(db: Session, profile_id: int) -> Profile | None:
    return db.scalar(select(Profile).where(Profile.id == profile_id))


def update_profile(db: Session, profile_id: int, payload: ProfileUpdate) -> Profile:
    profile = get_profile_by_id(db, profile_id)
    if not profile:
        raise UserNotFoundError(f"Profile {profile_id} not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(profile, k, v)
    db.commit()
    db.refresh(profile)
    return profile


def delete_profile(db: Session, profile_id: int) -> bool:
    profile = get_profile_by_id(db, profile_id)
    if not profile:
        raise UserNotFoundError(f"Profile {profile_id} not found")
    db.delete(profile)
    db.commit()
    return True


def create_or_update_profile(
    db: Session, user_id: int, payload: ProfileCreate | ProfileUpdate
) -> Profile:
    user = get_user_by_id(db, user_id)
    if not user:
        raise UserNotFoundError(f"User with ID {user_id} not found")

    profile = get_user_profile(db, user_id)
    update_data = payload.model_dump(exclude_unset=True)

    if not profile:
        profile = Profile(user_id=user_id, **update_data)
        db.add(profile)
    else:
        for key, value in update_data.items():
            setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


def list_users(db: Session, skip: int = 0, limit: int = 20) -> tuple[list[User], int]:
    from sqlalchemy import func
    from sqlalchemy.orm import selectinload

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


def update_user_role(db: Session, user_id: int, role: str) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise UserNotFoundError(user_id)
    user.role = role.strip().lower()
def create_user(db: Session, payload: Any) -> User:
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


def update_user(db: Session, user_id: int, payload: Any) -> User:
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
    user = get_user_by_id(db, user_id)
    if not user:
        raise UserNotFoundError(user_id)
    db.delete(user)
    db.commit()
    return True


# --- Citizen Facts & Provenance Audit Service ---


def record_citizen_fact(
    db: Session,
    user_id: int,
    fact_key: str,
    fact_value: Any,
    source_document_id: int | None = None,
    verified_by_user_id: int | None = None,
) -> CitizenFact:
    val_str = str(fact_value) if fact_value is not None else ""
    fact = CitizenFact(
        user_id=user_id,
        fact_key=fact_key,
        fact_value=val_str,
        source_document_id=source_document_id,
        verified_by_user_id=verified_by_user_id or user_id,
    )
    db.add(fact)
    return fact


def list_citizen_facts(db: Session, user_id: int) -> list[CitizenFact]:
    return list(
        db.scalars(
            select(CitizenFact)
            .where(CitizenFact.user_id == user_id)
            .order_by(CitizenFact.created_at.desc())
        ).all()
    )


def get_citizen_facts_audit(db: Session, user_id: int):
    from app.modules.auth.schemas import (
        CitizenFactResponse,
        CitizenFactsAuditResponse,
        FactProvenanceDetail,
        FactSourceEvidence,
    )
    from app.modules.vault.models import UserDocument

    facts = list_citizen_facts(db, user_id)
    docs = {
        d.id: d
        for d in db.scalars(
            select(UserDocument).where(UserDocument.user_id == user_id)
        ).all()
    }

    verified_map: dict[str, str] = {}
    grouped_sources: dict[str, list[FactSourceEvidence]] = {}

    for f in reversed(facts):
        verified_map[f.fact_key] = f.fact_value
        doc = docs.get(f.source_document_id) if f.source_document_id else None
        evidence = FactSourceEvidence(
            document_id=f.source_document_id,
            document_type=doc.document_type if doc else "Direct Entry / Self-Attested",
            file_name=doc.file_name if doc else None,
            verified_value=f.fact_value,
            verified_at=f.verified_at,
        )
        grouped_sources.setdefault(f.fact_key, []).append(evidence)

    provenance_map: dict[str, FactProvenanceDetail] = {}
    for key, val in verified_map.items():
        srcs = grouped_sources.get(key, [])
        distinct_doc_types = list(
            dict.fromkeys([s.document_type for s in srcs if s.document_type])
        )
        is_cross = len(distinct_doc_types) >= 2 or len(srcs) >= 2

        if len(distinct_doc_types) >= 2:
            reason = f"Cross-verified across {len(distinct_doc_types)} independent official sources ({', '.join(distinct_doc_types)})"
        elif len(distinct_doc_types) == 1:
            reason = f"Verified from official {distinct_doc_types[0]}"
        else:
            reason = "Self-attested citizen claim"

        provenance_map[key] = FactProvenanceDetail(
            fact_key=key,
            value=val,
            is_cross_verified=is_cross,
            verification_count=len(srcs),
            confidence_reason=reason,
            sources=srcs,
        )

    return CitizenFactsAuditResponse(
        user_id=user_id,
        total_facts=len(facts),
        verified_facts=verified_map,
        provenance_by_fact=provenance_map,
        fact_history=[CitizenFactResponse.model_validate(f) for f in facts],
    )




