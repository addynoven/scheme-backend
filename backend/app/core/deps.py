from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.database import get_db
from app.modules.auth.models import User
from app.modules.auth.service import get_user_by_id

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    try:
        payload = decode_token(token)
    except Exception:
        raise AuthenticationError("Could not validate credentials")

    token_type = payload.get("type")
    if token_type and token_type == "refresh":
        raise AuthenticationError("Invalid token type for authorization")

    user_id_str = payload.get("sub") or payload.get("id") or payload.get("userId")
    email = payload.get("email")
    if user_id_str is None and email is None:
        raise AuthenticationError("Invalid token payload")

    user = None
    if user_id_str is not None:
        try:
            user_id = int(user_id_str)
            user = get_user_by_id(db, user_id=user_id)
        except ValueError:
            # Better Auth string UUID or OAuth ID
            if email:
                user = db.query(User).filter(User.email == email).first()

    if user is None and email:
        user = db.query(User).filter(User.email == email).first()

    # Auto-provision Better Auth verified user in PostgreSQL if missing
    if user is None and email:
        from app.core.uid_generator import generate_citizen_uid, generate_household_uid
        from app.modules.auth.models import CitizenProfile

        role = "admin" if email.lower() in ("admin@gov.in", "admin@scheme.gov.in") else "citizen"
        user = User(
            citizen_uid=generate_citizen_uid(),
            household_uid=generate_household_uid(),
            email=email,
            hashed_password="BETTER_AUTH_MANAGED",
            role=role,
            is_verified=True,
        )
        db.add(user)
        try:
            db.commit()
            db.refresh(user)

            profile = CitizenProfile(user_id=user.id)
            db.add(profile)
            db.commit()
        except Exception:
            db.rollback()
            user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise AuthenticationError("User associated with token no longer exists")

    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise PermissionDeniedError(
            "Access forbidden: administrator privileges are required"
        )
    return current_user

