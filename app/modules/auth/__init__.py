from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.auth.schemas import (
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.modules.auth.service import (
    authenticate_user,
    create_or_update_profile,
    get_user_by_email,
    get_user_by_id,
    get_user_by_phone,
    get_user_profile,
    register_user,
)

__all__ = [
    "User",
    "Profile",
    "CitizenFact",
    "auth_router",
    "UserRegisterRequest",
    "UserLoginRequest",
    "TokenResponse",
    "UserResponse",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileResponse",
    "register_user",
    "authenticate_user",
    "get_user_by_id",
    "get_user_by_email",
    "get_user_by_phone",
    "get_user_profile",
    "create_or_update_profile",
]
