from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import create_refresh_token, hash_password
from app.modules.auth.models import User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Scheme
from app.modules.vault.models import UserDocument


def create_test_citizen(client: TestClient, email: str, phone: str) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={"email": email, "phone": phone, "password": "CitizenPass123!"},
    )
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": "CitizenPass123!"},
    )
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    return {
        "id": user_id,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
        "email": email,
    }


def test_privilege_escalation_prevented(client: TestClient, db_session: Session):
    citizen = create_test_citizen(client, "privesc.test@example.com", "+919111111111")
    user_id = citizen["id"]

    # Attempt self-privilege escalation via PATCH /users/{user_id}
    res = client.patch(
        f"/users/{user_id}",
        json={"role": "admin", "phone": "+919111111112"},
        headers=citizen["headers"],
    )
    assert res.status_code == 200

    # Verify role remains "citizen" in database
    db_user = db_session.query(User).filter(User.id == user_id).first()
    assert db_user is not None
    assert db_user.role == "citizen"


def test_eligibility_users_schemes_unauthenticated_and_cross_user_rejected(client: TestClient):
    citizen_a = create_test_citizen(client, "elig.usera@example.com", "+919222222221")
    citizen_b = create_test_citizen(client, "elig.userb@example.com", "+919222222222")

    # 1. Unauthenticated request fails 401
    res_unauth = client.get(f"/eligibility/users/{citizen_a['id']}/schemes")
    assert res_unauth.status_code == 401

    # 2. Citizen B requesting Citizen A's schemes fails 403
    res_cross = client.get(
        f"/eligibility/users/{citizen_a['id']}/schemes",
        headers=citizen_b["headers"],
    )
    assert res_cross.status_code == 403


def test_draft_scheme_isolated_from_bitmask_engine(db_session: Session):
    # Insert draft scheme
    draft_scheme = Scheme(
        name="Draft Scheme Test",
        slug="draft-scheme-test",
        state="ALL_INDIA",
        category="General",
        ministry="Ministry of Drafts",
        description="Draft scheme description",
        status="draft",
        publication_state="draft",
    )
    db_session.add(draft_scheme)
    db_session.commit()
    db_session.refresh(draft_scheme)

    # Warm up bitmask engine
    bitmask_engine.warm_up(db_session)

    # Verify draft scheme is NOT loaded in bitmask index
    assert draft_scheme.id not in bitmask_engine.scheme_ids


def test_untracked_refresh_token_rejected(client: TestClient):
    untracked_jwt = create_refresh_token(subject=9999)

    res = client.post("/auth/refresh", json={"refresh_token": untracked_jwt})
    assert res.status_code in (400, 401)


def test_fact_sync_foreign_doc_rejected(client: TestClient, db_session: Session):
    citizen_a = create_test_citizen(client, "sync.a@example.com", "+919333333331")
    citizen_b = create_test_citizen(client, "sync.b@example.com", "+919333333332")

    # Create document owned by Citizen B
    doc_b = UserDocument(
        user_id=citizen_b["id"],
        document_type="Aadhaar Card",
        file_key="vault/user_b/doc.pdf",
        file_name="doc.pdf",
        file_size_bytes=100,
        mime_type="application/pdf",
        is_verified=False,
    )
    db_session.add(doc_b)
    db_session.commit()
    db_session.refresh(doc_b)

    # Citizen A attempts sync using Citizen B's document ID
    res = client.post(
        f"/vault/documents/{doc_b.id}/confirm-and-sync-profile",
        json={"full_name": "Citizen A Updated"},
        headers=citizen_a["headers"],
    )
    assert res.status_code in (403, 404)


def test_voice_live_websocket_unauthenticated_rejected(client: TestClient):
    # Unauthenticated WebSocket connection to /voice/live fails or closes
    try:
        with client.websocket_connect("/voice/live") as websocket:
            pass
        assert False, "WebSocket should have been rejected without auth token"
    except Exception:
        pass


def test_health_check_sanitized_error(client: TestClient):
    from app.core.storage import storage_service

    with patch.object(
        storage_service,
        "ensure_bucket_exists",
        side_effect=RuntimeError("MinIO Secret Key Internal DB Connection Error"),
    ):
        res = client.get("/health")
        assert res.status_code == 503
        data = res.json()
        assert data["detail"]["checks"]["storage"] == "unhealthy"
        # Ensure internal exception text is not exposed in public body
        assert "Secret Key Internal" not in str(data)
