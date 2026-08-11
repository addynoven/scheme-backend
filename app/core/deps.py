from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.core.security import decode_token
from app.database import get_db
from app.models.user import User
from app.services.user import get_user_by_id

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
    if token_type != "access":
        raise AuthenticationError("Invalid token type for authorization")

    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise AuthenticationError("Invalid token payload")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise AuthenticationError("Invalid user identification in token")

    user = get_user_by_id(db, user_id=user_id)
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
