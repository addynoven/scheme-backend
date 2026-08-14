"""
Integration tests for V2.0 Multimodal Vision LLM Fact Extraction & Citizen Verification.
Verifies document-specific fact extraction, citizen verification modals, SQL profile progressive sync,
and ad-hoc 1-click form auto-fill.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.models import Profile, User


def create_authenticated_citizen(client: TestClient) -> tuple[str, int]:
    email = "citizen.ocr.test@example.com"
    client.post(
        "/auth/register",
        json={
            "email": email,
            "phone": "+919876599999",
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


def test_v20_extract_facts_from_pan_card(client: TestClient, db_session: Session):
    token, user_id = create_authenticated_citizen(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Upload a PAN Card mock binary to Vault
    pan_bytes = b"MOCK_IMAGE_BYTES_INCOME_TAX_DEPARTMENT_PERMANENT_ACCOUNT_NUMBER_PAN_ABCDE1234F"
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "PAN Card"},
        files={"file": ("pan_card.png", pan_bytes, "image/png")},
        headers=headers,
    )
    assert res_upload.status_code == 201
    doc_id = res_upload.json()["id"]

    # 2. Call Fact Extraction: POST /vault/documents/{id}/extract-facts
    res_extract = client.post(
        f"/vault/documents/{doc_id}/extract-facts",
        headers=headers,
    )
    assert res_extract.status_code == 200
    data = res_extract.json()

    assert data["detected_document_type"] == "PAN Card"
    assert data["confidence_score"] >= 0.85
    assert data["extracted_facts"]["full_name"] is not None
    assert data["extracted_facts"]["date_of_birth"] is not None
    # PAN card should NOT extract income or caste
    assert data["extracted_facts"]["annual_income"] is None

    # 3. Citizen Verification Step: Confirm and sync verified facts to SQL profile
    sync_payload = {
        "full_name": "Ramesh Kumar Patel",
        "date_of_birth": "1985-06-20",
        "gender": "male",
        "state": "Madhya Pradesh",
        "occupation": "farmer",
    }
    res_sync = client.post(
        f"/vault/documents/{doc_id}/confirm-and-sync-profile",
        json=sync_payload,
        headers=headers,
    )
    assert res_sync.status_code == 200
    sync_data = res_sync.json()
    assert sync_data["status"] == "synced"
    assert "full_name" in sync_data["synced_fields"]
    assert "date_of_birth" in sync_data["synced_fields"]

    # 4. Verify SQL database has updated Profile
    profile = db_session.query(Profile).filter(Profile.user_id == user_id).first()
    assert profile is not None
    assert profile.full_name == "Ramesh Kumar Patel"
    assert str(profile.date_of_birth) == "1985-06-20"
    assert profile.state == "Madhya Pradesh"


def test_v20_progressive_profile_enrichment_with_income_certificate(
    client: TestClient, db_session: Session
):
    token, user_id = create_authenticated_citizen(client)
    headers = {"Authorization": f"Bearer {token}"}

    # Initial profile setup
    client.post(
        "/users/me/profile",
        json={
            "full_name": "Murugan Swamy",
            "date_of_birth": "1959-01-01",
            "gender": "male",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "annual_income": 0,  # Unset
            "occupation": "retired",
        },
        headers=headers,
    )

    # Upload Income Certificate
    income_cert_bytes = b"MOCK_IMAGE_REVENUE_DEPARTMENT_ANNUAL_INCOME_CERTIFICATE_120000"
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "Income Certificate"},
        files={"file": ("income_certificate.pdf", income_cert_bytes, "application/pdf")},
        headers=headers,
    )
    doc_id = res_upload.json()["id"]

    # Extract
    res_extract = client.post(
        f"/vault/documents/{doc_id}/extract-facts",
        headers=headers,
    )
    assert res_extract.status_code == 200

    # Confirm only the annual_income field
    res_sync = client.post(
        f"/vault/documents/{doc_id}/confirm-and-sync-profile",
        json={"annual_income": 120000},
        headers=headers,
    )
    assert res_sync.status_code == 200

    # Verify existing fields (state, DOB, occupation) are preserved and income is updated in SQL DB!
    profile = db_session.query(Profile).filter(Profile.user_id == user_id).first()
    assert profile.state == "Tamil Nadu"  # Preserved!
    assert profile.occupation == "retired"  # Preserved!
    assert profile.annual_income == 120000  # Enriched!


def test_v20_quick_extract_for_onboarding_form(client: TestClient):
    # Ad-hoc extract for anonymous citizen filling /check form
    aadhaar_bytes = b"MOCK_IMAGE_UIDAI_GOVERNMENT_OF_INDIA_AADHAAR_FEMALE_MAHARASHTRA"
    res = client.post(
        "/vault/extract-quick",
        data={"document_type": "Aadhaar Card"},
        files={"file": ("my_aadhaar.jpg", aadhaar_bytes, "image/jpeg")},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["detected_document_type"] == "Aadhaar Card"
    assert data["extracted_facts"]["full_name"] is not None
    assert data["extracted_facts"]["gender"] is not None
