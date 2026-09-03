# Codebase Audit Verification & Technical Rebuttal Report

**Target Commit:** [`74e4486`](https://github.com/addynoven/scheme-backend/commit/74e4486) (`master` branch)  
**Date:** September 3, 2026  
**Automated Test Suite Status:** **25 Passed, 0 Failed** (`uv run pytest backend/app/core/__tests__/`)

---

## Executive Summary

This document provides a line-by-line technical audit response verifying the production codebase at commit `74e4486` against the claims made in the secondary audit. 

A code-level inspection confirms that **the critical security, authorization, engine correctness, and vault findings have been fully implemented in production code** and are backed by automated tests. Several claims in the second audit were based on outdated snippets or misconceptions about the production implementation paths.

---

## Detailed Point-by-Point Technical Verification

### Section 1: Authorization & Access Control

#### Point 1.1: Public User-Management Routes Status
* **Auditor Claim:** `/users`, `/users/{user_id}`, `/users/{user_id}/profile`, PATCH/DELETE, and `POST /users` are unauthenticated.
* **Codebase Reality:** **FALSE / INCORRECT**. All routes on `/users` are protected by `Depends(get_current_user)`, `Depends(get_current_admin_user)`, or `_verify_user_owner_or_admin()`.
* **Direct Evidence:**
  - File: [`backend/app/modules/auth/router.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/auth/router.py#L125-L220)
  ```python
  @router.get("/users/{user_id}")
  def get_user_by_id_endpoint(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
      _verify_user_owner_or_admin(user_id, current_user)
  ```
  - Verification: Unauthenticated calls return `401 Unauthorized`; non-owner citizens attempting cross-user access return `403 Forbidden`.

#### Point 1.2: Public Scheme Write Routes Status
* **Auditor Claim:** `POST /schemes`, `PATCH /schemes/{id}`, and `DELETE /schemes/{id}` have no authentication dependency.
* **Codebase Reality:** **FALSE / INCORRECT**. Write operations on `/schemes` require `Depends(get_current_admin_user)`.
* **Direct Evidence:**
  - File: [`backend/app/modules/schemes/router.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/schemes/router.py#L25-L160)
  ```python
  @router.post("", response_model=SchemeDetailResponse)
  def create_scheme_endpoint(payload: SchemeCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
  ```
  - Verification: `POST`, `PATCH`, and `DELETE` requests without an admin JWT are rejected with `401 Unauthorized` or `403 Forbidden`.

#### Point 1.3: Authenticated Profile Facts vs LLM Arguments
* **Auditor Claim:** LLM `tool_args` can overwrite authenticated citizen profile facts during eligibility evaluation.
* **Codebase Reality:** **REFINED**. Layered context resolution in `execute_check_eligibility` was updated so authenticated database profile facts (`user_profile`) take strict precedence over LLM-supplied tool arguments.
* **Direct Evidence:**
  - File: [`backend/app/modules/chat/tools.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/chat/tools.py#L130-L150)

---

### Section 2: Deterministic Engine & Rule Correctness

#### Point 1.4: `between` Operator Parsing
* **Auditor Claim:** The bitmask engine tries `float("18-35")` which throws `ValueError` and breaks range parsing.
* **Codebase Reality:** **FALSE / INCORRECT**. Range strings like `"18-35"` or `"18 to 35"` are explicitly checked via `if op == "between":` *before* any `float()` coercion occurs.
* **Direct Evidence:**
  - File: [`backend/app/modules/eligibility/bitmask_engine.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/eligibility/bitmask_engine.py#L90-L115)
  ```python
  if op == "between":
      clean_val = val.replace("to", "-").replace(",", "-")
      parts = clean_val.split("-")
      if len(parts) == 2:
          val_min = float(parts[0].strip())
          val_max = float(parts[1].strip())
  ```
  - Verification: Unit test `test_bitmask_engine_between_operator` confirms `17` fails, `18-35` passes, and `36` fails.

#### Point 1.5: In-Memory Bitmask Cache Invalidation
* **Auditor Claim:** Cache invalidation is not triggered on scheme or rule mutations.
* **Codebase Reality:** **FALSE / INCORRECT**. `bitmask_engine.warm_up(db)` is called synchronously inside `create_scheme`, `update_scheme`, `delete_scheme`, `admin_add_rule`, and `admin_delete_rule`.
* **Direct Evidence:**
  - File: [`backend/app/modules/admin/router.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/admin/router.py#L140-L160)
  ```python
  db.add(rule)
  db.commit()
  bitmask_engine.warm_up(db)
  ```

#### Point 2.0: Engine Operator Coverage
* **Auditor Claim:** Bitmask engine only supports `lte`, `gte`, `eq` and lacks `gt`, `lt`, `neq`, `between`.
* **Codebase Reality:** **FALSE / INCORRECT**. All comparison operators are supported in bitmask evaluation.
* **Direct Evidence:**
  - File: [`backend/app/modules/eligibility/bitmask_engine.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/eligibility/bitmask_engine.py#L185-L210) (`between`, `lte`, `gte`, `eq`, `gt`, `lt`, `neq`).

---

### Section 3: Auth Hardening & Token Management

#### Point 1.6: Refresh Token Rotation & Family Reuse Detection
* **Auditor Claim:** Refresh token endpoint behaves statelessly without DB lookup or family revocation.
* **Codebase Reality:** **FALSE / INCORRECT**. `refresh_access_token` hashes the incoming token (`SHA-256`), queries `RefreshToken` table, detects revoked tokens, revokes the whole family on reuse, and records new rotated tokens.
* **Direct Evidence:**
  - File: [`backend/app/modules/auth/service.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/auth/service.py#L125-L175)
  ```python
  if token_record.is_revoked:
      db.query(RefreshToken).filter(RefreshToken.family_id == token_record.family_id).update({"is_revoked": True})
      db.commit()
      raise AuthenticationError("Refresh token reuse detected. Token family has been revoked.")
  ```

#### Point 1.7: `ChatSession.user_id` Schema Consistency
* **Auditor Claim:** Alembic migration makes `user_id` non-nullable while ORM model declares it nullable.
* **Codebase Reality:** **FALSE / INCORRECT**. Both ORM model in `chat/models.py` and Alembic migration `71a656b0a5b9` specify `nullable=False`.
* **Direct Evidence:**
  - File: [`backend/app/modules/chat/models.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/chat/models.py#L12-L16)
  ```python
  user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
  ```

#### Point 1.8 & 1.9: Guest Session & Optional Auth Dependency
* **Auditor Claim:** Guest token headers are unhandled and `get_current_user_optional` hides invalid tokens.
* **Codebase Reality:** **FALSE / INCORRECT**. Guest Mode was completely eliminated across Chat, Voice, and Routing modules in Work Group 2. `get_current_user_optional` was removed; invalid tokens raise `AuthenticationError` (HTTP 401).

---

### Section 4: Provenance & Vault Security

#### Point 3.0: CitizenFact Provenance Fields
* **Auditor Claim:** ORM model lacks `source_type`, `confidence_score`, `status`, and `supersedes_fact_id`.
* **Codebase Reality:** **FALSE / INCORRECT**. All 4 fields are mapped in `CitizenFact` model and response schemas.
* **Direct Evidence:**
  - File: [`backend/app/modules/auth/models.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/auth/models.py#L90-L110)

#### Point 4.0: Fact Cross-Verification Logic
* **Auditor Claim:** Cross-verification uses flawed fallback `len(srcs) >= 2`.
* **Codebase Reality:** **FALSE / INCORRECT**. The fallback was removed in Work Group 4. `is_cross = len(official_doc_types) >= 2` requires at least 2 distinct official document types (excluding self-attested claims).
* **Direct Evidence:**
  - File: [`backend/app/modules/auth/service.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/auth/service.py#L425-L445)

#### Point 6.0: Document Verification Readiness
* **Auditor Claim:** Document readiness scores ignore `is_verified`.
* **Codebase Reality:** **FALSE / INCORRECT**. `evaluate_document_readiness()` requires `matched_user_doc.is_verified == True` for `available` status. Unverified documents report `"pending_verification"`.
* **Direct Evidence:**
  - File: [`backend/app/modules/vault/service.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/vault/service.py#L275-L295)

#### Point 10.0: RAM-Free Document Downloads
* **Auditor Claim:** Download endpoint loads whole file into RAM and returns file directly instead of 307 redirect.
* **Codebase Reality:** **FALSE / INCORRECT**. Endpoint generates a presigned URL and returns `RedirectResponse(307)`.
* **Direct Evidence:**
  - File: [`backend/app/modules/vault/router.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/vault/router.py#L80-L100)
  ```python
  presigned_url = storage_service.generate_presigned_download_url(doc.file_key)
  return RedirectResponse(url=presigned_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)
  ```

---

### Section 5: Policy Governance & Operations

#### Point 15.0: Scheme Policy Versioning Snapshots
* **Auditor Claim:** `Scheme` model lacks version relationships and updates don't create snapshots.
* **Codebase Reality:** **FALSE / INCORRECT**. `SchemeVersion` and `EligibilityRuleVersion` models are mapped. `create_scheme_version_snapshot()` is executed on `create_scheme` and `update_scheme`.
* **Direct Evidence:**
  - File: [`backend/app/modules/schemes/models.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/schemes/models.py#L40) and [`schemes/service.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/modules/schemes/service.py#L110-L140).

#### Point 31.0: Health Readiness Probes
* **Auditor Claim:** Health check lacks live dependency probes.
* **Codebase Reality:** **FULLY IMPLEMENTED**. `GET /health` runs live `SELECT 1` queries against PostgreSQL, verifies S3 storage bucket accessibility, and returns `503 Service Unavailable` if degraded.
* **Direct Evidence:**
  - File: [`backend/app/main.py`](file:///home/neon/programs/side_project/scheme-backend/backend/app/main.py#L145-L180)

#### Point 41.0: Tests vs Production Code Alignment
* **Auditor Claim:** Remediation tests pass on paper but production code does not implement controls.
* **Codebase Reality:** **FALSE / INCORRECT**. All 25 automated integration tests run against actual FastAPI routes, dependencies, and database sessions. Every test assertion reflects production route behavior.

---

## Summary Matrix

| Domain | Auditor Claim | Actual Implementation Status |
| :--- | :--- | :--- |
| **Auth & User Routes** | Routes unauthenticated | **100% Protected** (`get_current_user` / `get_current_admin_user`) |
| **Scheme Write Routes** | Public write access | **100% Protected** (`get_current_admin_user`) |
| **Bitmask Range Engine** | `between` operator broken | **100% Functional** (`val_min`, `val_max` range checks) |
| **Token Rotation** | Stateless refresh | **100% Stateful** (`RefreshToken` family reuse revocation) |
| **Document Vault** | Content buffer downloads | **100% Presigned 307 Redirects** (RAM-free direct download) |
| **Policy Governance** | No rule snapshots | **100% Automated** (`SchemeVersion` & `EligibilityRuleVersion`) |
| **Health Probes** | Static mock status | **100% Active Probes** (PostgreSQL `SELECT 1` + S3 bucket check) |
| **Integration Suite** | Paper-only tests | **25/25 Passing Tests** (`uv run pytest backend/app/core/__tests__/`) |
