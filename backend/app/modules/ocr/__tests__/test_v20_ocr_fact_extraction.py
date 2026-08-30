"""
Integration tests for V2.0 Multimodal Vision LLM Fact Extraction & Citizen Verification.
Verifies document-specific fact extraction, citizen verification modals, SQL profile progressive sync,
and ad-hoc 1-click form auto-fill.
"""

from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.models import Profile, User
from app.modules.ocr.schemas import (
    ExtractedDocumentFacts,
    ExtractedDocumentFactsResponse,
)


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
    pan_bytes = b"MOCK_IMAGE_BYTES_PAN_CARD"
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "PAN Card"},
        files={"file": ("pan_card.png", pan_bytes, "image/png")},
        headers=headers,
    )
    assert res_upload.status_code == 201
    doc_id = res_upload.json()["id"]

    mock_gemini_pan_response = ExtractedDocumentFactsResponse(
        status="success",
        detected_document_type="PAN Card",
        confidence_score=0.96,
        evidence_summary="Extracted name, DOB, and PAN from Income Tax Department PAN Card.",
        extracted_facts=ExtractedDocumentFacts(
            full_name="Ramesh Kumar Patel",
            date_of_birth="1985-06-20",
            age=41,
            document_number_masked="XXXXX1234F",
            annual_income=None,  # PAN never extracts income
            caste_category=None,
        ),
        applicable_profile_fields=["full_name", "date_of_birth"],
    )

    with patch("app.modules.ocr.service.extract_facts_with_gemini_vision", return_value=mock_gemini_pan_response):
        res_extract = client.post(
            f"/vault/documents/{doc_id}/extract-facts",
            headers=headers,
        )
        assert res_extract.status_code == 200
        data = res_extract.json()

        assert data["detected_document_type"] == "PAN Card"
        assert data["confidence_score"] == 0.96
        assert data["extracted_facts"]["full_name"] == "Ramesh Kumar Patel"
        assert data["extracted_facts"]["date_of_birth"] == "1985-06-20"
        assert data["extracted_facts"]["annual_income"] is None

    # 3. Citizen Verification Step: Confirm and sync verified facts to SQL profile
    sync_payload = {
        "full_name": "Ramesh Kumar Patel",
        "date_of_birth": "1985-06-20",
        "gender": "male",
        "state": "Madhya Pradesh",
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
            "annual_income": 0,
            "occupation": "retired",
        },
        headers=headers,
    )

    # Upload Income Certificate
    income_cert_bytes = b"MOCK_IMAGE_REVENUE_DEPARTMENT_ANNUAL_INCOME_CERTIFICATE"
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "Income Certificate"},
        files={"file": ("income_certificate.pdf", income_cert_bytes, "application/pdf")},
        headers=headers,
    )
    doc_id = res_upload.json()["id"]

    mock_gemini_income_response = ExtractedDocumentFactsResponse(
        status="success",
        detected_document_type="Income Certificate",
        confidence_score=0.94,
        evidence_summary="Extracted annual income from Revenue Department certificate.",
        extracted_facts=ExtractedDocumentFacts(
            full_name="Murugan Swamy",
            annual_income=120000,
            state="Tamil Nadu",
            district="Madurai",
        ),
        applicable_profile_fields=["annual_income", "state", "district"],
    )

    with patch("app.modules.ocr.service.extract_facts_with_gemini_vision", return_value=mock_gemini_income_response):
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
    # Ad-hoc extract for anonymous citizen filling /check form via dedicated OCR endpoint
    aadhaar_bytes = b"MOCK_IMAGE_AADHAAR"
    mock_aadhaar_response = ExtractedDocumentFactsResponse(
        status="success",
        detected_document_type="Aadhaar Card",
        confidence_score=0.98,
        evidence_summary="Extracted name, DOB, and gender from UIDAI Aadhaar Card.",
        extracted_facts=ExtractedDocumentFacts(
            full_name="Sunita Devi",
            date_of_birth="1992-04-12",
            age=34,
            gender="female",
            state="Maharashtra",
            district="Pune",
            document_number_masked="XXXX-XXXX-4532",
        ),
        applicable_profile_fields=["full_name", "date_of_birth", "gender", "state", "district"],
    )

    with patch("app.modules.ocr.service.extract_facts_with_gemini_vision", return_value=mock_aadhaar_response):
        res = client.post(
            "/ocr/extract",
            data={"document_type": "Aadhaar Card"},
            files={"file": ("my_aadhaar.jpg", aadhaar_bytes, "image/jpeg")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["detected_document_type"] == "Aadhaar Card"
        assert data["extracted_facts"]["full_name"] == "Sunita Devi"
        assert data["extracted_facts"]["gender"] == "female"


def test_v20_regex_pattern_fallback_without_gemini(client: TestClient):
    # Test real regex fallback on raw readable text without calling Gemini
    text_document = b"GOVERNMENT OF INDIA INCOME TAX DEPARTMENT\nPermanent Account Number\nABCDE1234F\nDOB: 15/08/1990"
    with patch("app.modules.ocr.service.settings.GEMINI_API_KEY", ""):
        res = client.post(
            "/ocr/extract",
            data={"document_type": "PAN Card"},
            files={"file": ("pan_text.txt", text_document, "text/plain")},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["detected_document_type"] == "PAN Card"
        assert data["extracted_facts"]["document_number_masked"] == "ABXXXXX4F"
        assert data["extracted_facts"]["date_of_birth"] == "15/08/1990"
        # No fake name invented
        assert data["extracted_facts"]["full_name"] is None
