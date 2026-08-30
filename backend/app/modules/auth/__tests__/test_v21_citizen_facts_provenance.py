"""
Integration tests for V2.1 Citizen Facts Provenance Table & Audit Trail.
Verifies that when a citizen verifies and syncs facts from documents,
immutable rows are created in `citizen_facts` with exact source document IDs,
timestamps, and audit histories.
"""

from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.ocr.schemas import (
    ExtractedDocumentFacts,
    ExtractedDocumentFactsResponse,
)


def create_authenticated_citizen(client: TestClient) -> tuple[str, int]:
    email = "citizen.facts.audit@example.com"
    client.post(
        "/auth/register",
        json={
            "email": email,
            "phone": "+919876588888",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "Password123!",
        },
    )
    token = res_login.json()["access_token"]
    user_data = client.get("/users/me", headers={"Authorization": f"Bearer {token}"}).json()
    return token, user_data["id"]


def test_v21_citizen_fact_provenance_recording(client: TestClient, db_session: Session):
    token, user_id = create_authenticated_citizen(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload PAN Card
    pan_bytes = b"MOCK_IMAGE_BYTES_PAN_CARD"
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "PAN Card"},
        files={"file": ("pan_card.png", pan_bytes, "image/png")},
        headers=headers,
    )
    assert res_upload.status_code == 201
    doc_id = res_upload.json()["id"]

    # 2. Confirm and sync verified facts from PAN Card
    sync_payload = {
        "full_name": "Aditya Sahu",
        "date_of_birth": "2002-08-07",
        "gender": "male",
    }
    res_sync = client.post(
        f"/vault/documents/{doc_id}/confirm-and-sync-profile",
        json=sync_payload,
        headers=headers,
    )
    assert res_sync.status_code == 200

    # 3. Query GET /users/me/facts endpoint
    res_facts = client.get("/users/me/facts", headers=headers)
    assert res_facts.status_code == 200
    facts_data = res_facts.json()

    assert facts_data["user_id"] == user_id
    assert facts_data["total_facts"] == 3
    assert facts_data["verified_facts"]["full_name"] == "Aditya Sahu"
    assert facts_data["verified_facts"]["date_of_birth"] == "2002-08-07"
    assert facts_data["verified_facts"]["gender"] == "male"

    # Check provenance on each history item
    for fact in facts_data["fact_history"]:
        assert fact["source_document_id"] == doc_id
        assert fact["verified_by_user_id"] == user_id
        assert fact["verified_at"] is not None

    # 4. Upload Second Document (Income Certificate)
    income_cert_bytes = b"MOCK_INCOME_CERT_BYTES"
    res_income_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "Income Certificate"},
        files={"file": ("income_cert.pdf", income_cert_bytes, "application/pdf")},
        headers=headers,
    )
    assert res_income_upload.status_code == 201
    income_doc_id = res_income_upload.json()["id"]

    # Confirm and sync Income fact
    res_income_sync = client.post(
        f"/vault/documents/{income_doc_id}/confirm-and-sync-profile",
        json={"annual_income": 150000, "state": "Madhya Pradesh"},
        headers=headers,
    )
    assert res_income_sync.status_code == 200

    # 5. Re-check Facts Audit Trail: Now 5 total verified facts with 2 distinct source documents!
    res_updated_facts = client.get("/users/me/facts", headers=headers)
    assert res_updated_facts.status_code == 200
    updated_data = res_updated_facts.json()

    assert updated_data["total_facts"] == 5
    assert updated_data["verified_facts"]["annual_income"] == "150000"
    assert updated_data["verified_facts"]["state"] == "Madhya Pradesh"
    assert updated_data["verified_facts"]["full_name"] == "Aditya Sahu"

    # Verify SQL records directly
    income_fact = (
        db_session.query(CitizenFact)
        .filter(CitizenFact.user_id == user_id, CitizenFact.fact_key == "annual_income")
        .first()
    )
    assert income_fact is not None
    assert income_fact.fact_value == "150000"
    assert income_fact.source_document_id == income_doc_id
