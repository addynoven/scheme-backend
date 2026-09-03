import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import RefreshToken, User


def test_optional_auth_dependency_strictness(client: TestClient):
    # 1. No Authorization header -> guest session creation succeeds
    res_guest = client.post("/chat/sessions", json={"title": "Guest Session"})
    assert res_guest.status_code == 201

    # 2. Present but malformed/invalid Authorization header -> fails HTTP 401
    bad_headers = {"Authorization": "Bearer invalid.malformed.jwt.token"}
    res_bad = client.post("/chat/sessions", json={"title": "Hacked Session"}, headers=bad_headers)
    assert res_bad.status_code == 401
    assert "error" in res_bad.json() or "detail" in res_bad.json()


def test_refresh_token_rotation_and_reuse_detection(client: TestClient, db_session: Session):
    # 1. Register & Login User
    client.post(
        "/auth/register",
        json={
            "email": "rotation.user@example.com",
            "phone": "+919333300001",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "rotation.user@example.com",
            "password": "Password123!",
        },
    )
    assert res_login.status_code == 200
    tokens1 = res_login.json()
    refresh_token_1 = tokens1["refresh_token"]

    # Verify refresh_token_1 is saved in DB
    ref_db1 = db_session.query(RefreshToken).filter(RefreshToken.is_revoked == False).first()
    assert ref_db1 is not None

    # 2. First Refresh -> Issues Refresh Token 2 & Revokes Refresh Token 1
    res_ref1 = client.post("/auth/refresh", json={"refresh_token": refresh_token_1})
    assert res_ref1.status_code == 200
    tokens2 = res_ref1.json()
    refresh_token_2 = tokens2["refresh_token"]
    assert refresh_token_2 != refresh_token_1

    # 3. REUSE DETECTED: Attempting to use refresh_token_1 again
    res_reuse = client.post("/auth/refresh", json={"refresh_token": refresh_token_1})
    assert res_reuse.status_code == 401

    # 4. Verification of Family Revocation: refresh_token_2 should now also be revoked due to family invalidation
    res_ref2_after_reuse = client.post("/auth/refresh", json={"refresh_token": refresh_token_2})
    assert res_ref2_after_reuse.status_code == 401


def test_production_config_validation():
    # Save original settings
    orig_dev_mode = settings.DEV_MODE
    orig_secret = settings.SECRET_KEY

    try:
        settings.DEV_MODE = False
        settings.TESTING = False
        settings.SECRET_KEY = "development_secret_key_change_in_production_super_secure_key_123456"

        with pytest.raises(RuntimeError) as exc_info:
            settings.validate_production_secrets()
        assert "Default SECRET_KEY used in production mode" in str(exc_info.value)
    finally:
        # Restore settings
        settings.DEV_MODE = orig_dev_mode
        settings.TESTING = True
        settings.SECRET_KEY = orig_secret
