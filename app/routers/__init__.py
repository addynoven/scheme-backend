from fastapi import APIRouter

from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.eligibility import router as eligibility_router
from app.routers.open_data import router as open_data_router
from app.routers.schemes import router as schemes_router
from app.routers.users import router as users_router
from app.routers.vault import router as vault_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(schemes_router)
api_router.include_router(users_router)
api_router.include_router(eligibility_router)
api_router.include_router(admin_router)
api_router.include_router(vault_router)
api_router.include_router(open_data_router)

__all__ = [
    "api_router",
    "auth_router",
    "schemes_router",
    "users_router",
    "eligibility_router",
    "admin_router",
    "vault_router",
    "open_data_router",
]
