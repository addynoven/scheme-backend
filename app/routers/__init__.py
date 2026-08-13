from fastapi import APIRouter

from app.modules.admin.router import router as admin_router
from app.modules.auth.router import router as auth_router
from app.modules.eligibility.router import router as eligibility_router
from app.modules.ingestion.router import router as open_data_router
from app.modules.schemes.router import router as schemes_router
from app.modules.vault.router import router as vault_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(schemes_router)
api_router.include_router(eligibility_router)
api_router.include_router(admin_router)
api_router.include_router(vault_router)
api_router.include_router(open_data_router)

__all__ = [
    "api_router",
    "auth_router",
    "schemes_router",
    "eligibility_router",
    "admin_router",
    "vault_router",
    "open_data_router",
]
