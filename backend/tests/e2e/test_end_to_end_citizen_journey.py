import io
import pytest
from fastapi.testclient import TestClient
from moto import mock_aws

from app.core.config import settings
from app.core.storage import storage_service
from app.seeds.seed_national_schemes import seed_national_schemes


@pytest.fixture(autouse=True)
def mock_s3_environment():
    old_endpoint = settings.S3_ENDPOINT_URL
    settings.S3_ENDPOINT_URL = None
    with mock_aws():
        storage_service.ensure_bucket_exists()
        yield
    settings.S3_ENDPOINT_URL = old_endpoint


def test_complete_citizen_end_to_end_journey(client: TestClient, db_session):
    """
    Validates the full 9-step citizen journey from onboarding to application-readiness:
    1. Register
    2. Login
    3. Fill profile
    4. Upload Aadhaar
    5. Upload Passbook
    6. Check eligibility
    7. Read human-friendly explanation
    8. See document readiness score
    9. Open official source
    """
    # Pre-seed the 12 national schemes
    seed_national_schemes(db_session)

    # -------------------------------------------------------------
    # Step 1: Register Citizen Account
    # -------------------------------------------------------------
    reg_res = client.post(
        "/auth/register",
        json={
            "email": "farmer.ramesh.journey@gov.in",
            "phone": "+919888877777",
            "password": "SecurePassword123!",
        },
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == "farmer.ramesh.journey@gov.in"
    assert user_data["role"] == "citizen"

    # -------------------------------------------------------------
    # Step 2: Login and Obtain JWT Token Pair
    # -------------------------------------------------------------
    login_res = client.post(
        "/auth/login",
        json={
            "email": "farmer.ramesh.journey@gov.in",
            "password": "SecurePassword123!",
        },
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    # -------------------------------------------------------------
    # Step 3: Fill Out Citizen Profile
    # -------------------------------------------------------------
    profile_payload = {
        "full_name": "Ramesh Chandra Patel",
        "date_of_birth": "1979-05-15",
        "gender": "male",
        "state": "Madhya Pradesh",
        "district": "Sehore",
        "annual_income": 120000,
        "occupation": "farmer",
    }
    profile_res = client.post(
        "/users/me/profile", json=profile_payload, headers=headers
    )
    assert profile_res.status_code == 200
    assert profile_res.json()["occupation"] == "farmer"

    # -------------------------------------------------------------
    # Step 4: Upload Aadhaar Card to Document Vault
    # -------------------------------------------------------------
    aadhaar_file = io.BytesIO(b"%PDF-1.4 binary stream representing Aadhaar Card")
    upload_aadhaar_res = client.post(
        "/vault/documents/upload",
        data={
            "document_type": "Aadhaar Card",
            "document_number_masked": "XXXX-XXXX-4532",
        },
        files={"file": ("aadhaar_card.pdf", aadhaar_file, "application/pdf")},
        headers=headers,
    )
    assert upload_aadhaar_res.status_code == 201
    assert upload_aadhaar_res.json()["document_type"] == "Aadhaar Card"

    # -------------------------------------------------------------
    # Step 5: Upload Bank Passbook to Document Vault
    # -------------------------------------------------------------
    passbook_file = io.BytesIO(b"%PDF-1.4 binary stream representing Bank Passbook")
    upload_passbook_res = client.post(
        "/vault/documents/upload",
        data={"document_type": "Bank Passbook"},
        files={"file": ("sbi_passbook.pdf", passbook_file, "application/pdf")},
        headers=headers,
    )
    assert upload_passbook_res.status_code == 201
    assert upload_passbook_res.json()["document_type"] == "Bank Passbook"

    # -------------------------------------------------------------
    # Step 6: Check Eligibility across all National Schemes
    # -------------------------------------------------------------
    explained_res = client.get("/eligibility/me/explained", headers=headers)
    assert explained_res.status_code == 200
    report = explained_res.json()
    assert report["eligible_count"] >= 1

    # Locate PM Kisan in eligible schemes
    pm_kisan = next(
        s for s in report["eligible_schemes"] if s["scheme_slug"] == "pm-kisan"
    )
    assert pm_kisan is not None
    pm_kisan_id = pm_kisan["scheme_id"]

    # -------------------------------------------------------------
    # Step 7: Read Human-Friendly Explanation (Why did I qualify?)
    # -------------------------------------------------------------
    assert pm_kisan["is_eligible"] is True
    assert pm_kisan["match_percentage"] == 100.0
    assert pm_kisan["criteria_passed"] == 2
    assert "You meet all 2 eligibility criteria" in pm_kisan["summary_reason"]

    # Verify plain-English reasons for criteria
    reasons = [c["reason"] for c in pm_kisan["passed_criteria"]]
    assert any("matches the required criteria" in r for r in reasons)
    assert any("within the allowable limit" in r for r in reasons)

    # -------------------------------------------------------------
    # Step 8: Check Document Readiness Score for PM Kisan
    # -------------------------------------------------------------
    readiness_res = client.get(
        f"/vault/readiness/schemes/{pm_kisan_id}", headers=headers
    )
    assert readiness_res.status_code == 200
    readiness = readiness_res.json()

    # PM Kisan requires 3 documents: Aadhaar (uploaded), Passbook (uploaded), Land Records (missing)
    assert readiness["mandatory_total"] == 3
    assert readiness["mandatory_available"] == 2
    assert readiness["readiness_percentage"] == 66.7
    assert readiness["is_ready_to_apply"] is False
    assert "You have 2/3 mandatory documents ready" in readiness["summary"]

    # Check the actionable checklist
    status_map = {
        item["document_name"]: item["status"] for item in readiness["checklist"]
    }
    assert status_map["Aadhaar Card"] == "available"
    assert status_map["Bank Passbook"] == "available"
    assert status_map["Land Records"] == "missing"

    # -------------------------------------------------------------
    # Step 9: Verify Official Source & Application Portal Links
    # -------------------------------------------------------------
    assert pm_kisan["application_url"] == "https://pmkisan.gov.in"
