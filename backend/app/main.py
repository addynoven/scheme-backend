from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.error_handlers import register_error_handlers
from app.database import SessionLocal
from app.modules.admin.router import router as admin_router
from app.modules.auth.router import router as auth_router
from app.modules.chat.router import router as chat_router
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.eligibility.router import router as eligibility_router
from app.modules.household.router import router as household_router
from app.modules.ingestion.router import router as open_data_router
from app.modules.ocr.router import router as ocr_router
from app.modules.routing.router import router as routing_router
from app.modules.schemes.router import router as schemes_router
from app.modules.vault.router import router as vault_router
from app.modules.voice.router import router as voice_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up in-memory bitmask rule engine on startup
    db = SessionLocal()
    try:
        bitmask_engine.warm_up(db)
    finally:
        db.close()
    yield

API_DESCRIPTION = """
## 🏛️ Government Welfare Scheme Navigator & Eligibility API

A modern, high-performance platform for **scheme discovery**, **rule-based eligibility evaluation**, **explainable match reasons**, and **citizen document readiness**.

---

### 🔑 Authentication Flow
- **Registration**: `POST /auth/register` creates a citizen account.
- **Login**: `POST /auth/login` returns an **Access Token** (30 min) and a **Refresh Token** (7 days).
- **Authorized Requests**: Include the header `Authorization: Bearer <access_token>` in protected endpoints.
- **Token Rotation**: `POST /auth/refresh` issues a new token pair without requiring re-login.

---

### 🧠 Core Product Engines

1. **Discovery Engine (`/schemes`)**
   - Search by citizen problems/needs (e.g. `GET /schemes/search?q=fertilizer` or `?q=pension`).
   - Filter by categories (`Agriculture`, `Healthcare`, `Education`, `Social Welfare`, etc.).

2. **Eligibility & Reasoning Engine (`/eligibility`)**
   - Ad-hoc checks (`POST /eligibility/explain`) and Authenticated Profile matches (`GET /eligibility/me/explained`).
   - Returns plain-English explanations, formatted figures (₹, age), and groups results into:
     - `eligible_schemes` (100% matched)
     - `nearly_eligible_schemes` (50%–99% matched with exact unmet criteria)
     - `ineligible_schemes` (< 50% matched)

3. **Document Vault & Readiness Engine (`/vault`)**
   - Secure S3 / MinIO storage for citizen identity documents.
   - Time-limited presigned download URLs.
   - Calculates **Application Readiness Score** (e.g. 2/3 mandatory documents ready, 1 missing) with actionable checklists.

4. **Administration & RBAC (`/admin`)**
   - Protected with `role: admin`.
   - Full CRUD for schemes, eligibility rules, and required documents.
   - Citizen role elevation.

---

### ⚠️ Predictable Error Contract
All API errors follow a standard JSON envelope:
```json
{
  "error": "ENTITY_NOT_FOUND | DUPLICATE_ENTITY | AUTHENTICATION_FAILED | PERMISSION_DENIED | VALIDATION_ERROR",
  "message": "Human-readable explanation of the error",
  "status_code": 404
}
```
"""

TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Citizen registration, login, token refresh, and authenticated session details.",
    },
    {
        "name": "Eligibility",
        "description": "Rule-based scheme matching with plain-English reasons and percentage scoring.",
    },
    {
        "name": "Schemes",
        "description": "Public scheme discovery, problem/tag search, category browsing, and details.",
    },
    {
        "name": "Users",
        "description": "Citizen profile management (demographics, income, occupation, location).",
    },
    {
        "name": "Document Vault & Readiness",
        "description": "MinIO/S3 document storage, secure presigned URLs, and application readiness checklists.",
    },
    {
        "name": "Admin Management",
        "description": "Administrative control plane for schemes, rules, documents, and staff roles (Admin only).",
    },
    {
        "name": "Health",
        "description": "System health and liveness checks.",
    },
]

app = FastAPI(
    title="Government Welfare Scheme Navigator API",
    description=API_DESCRIPTION,
    version="2.0.0",
    openapi_tags=TAGS_METADATA,
    lifespan=lifespan,
    contact={
        "name": "Scheme Navigator Engineering Team",
        "url": "https://github.com/side-project/scheme-backend",
    },
    license_info={
        "name": "MIT License",
    },
)

# Register centralized exception handlers
register_error_handlers(app)


@app.get(
    "/health",
    tags=["Health"],
    summary="Check API health and liveness",
    response_description="System status",
)
def health_check():
    return {"status": "ok", "version": "2.0.0", "bitmask_warmed": bitmask_engine.is_warmed}


app.include_router(auth_router)
app.include_router(schemes_router)
app.include_router(eligibility_router)
app.include_router(ocr_router)
app.include_router(vault_router)
app.include_router(household_router)
app.include_router(open_data_router)
app.include_router(admin_router)
app.include_router(routing_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(household_router)