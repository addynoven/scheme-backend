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


def test_document_vault_upload_and_readiness_calculation(
    client: TestClient, db_session
):
    seed_national_schemes(db_session)

    # 1. Register & Login Citizen Ramesh
    client.post(
        "/auth/register",
        json={
            "email": "farmer.ramesh.vault@gov.in",
            "phone": "+919555566666",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "farmer.ramesh.vault@gov.in",
            "password": "Password123!",
        },
    )
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get PM Kisan Scheme ID
    schemes_res = client.get("/schemes/slug/pm-kisan")
    assert schemes_res.status_code == 200
    pm_kisan_id = schemes_res.json()["id"]

    # 3. Check Initial Document Readiness -> 0/3 Ready
    res_initial_ready = client.get(
        f"/vault/readiness/schemes/{pm_kisan_id}", headers=headers
    )
    assert res_initial_ready.status_code == 200
    initial_data = res_initial_ready.json()
    assert initial_data["is_ready_to_apply"] is False
    assert initial_data["mandatory_total"] == 3
    assert initial_data["mandatory_available"] == 0
    assert initial_data["readiness_percentage"] == 0.0

    # 4. Upload Aadhaar Card
    dummy_pdf = io.BytesIO(b"%PDF-1.4 dummy aadhaar card pdf binary data")
    res_upload1 = client.post(
        "/vault/documents/upload",
        data={
            "document_type": "Aadhaar Card",
            "document_number_masked": "XXXX-XXXX-8899",
        },
        files={"file": ("aadhaar_card.pdf", dummy_pdf, "application/pdf")},
        headers=headers,
    )
    assert res_upload1.status_code == 201
    doc1_data = res_upload1.json()
    assert doc1_data["document_type"] == "Aadhaar Card"
    assert doc1_data["download_url"] is not None
    doc1_id = doc1_data["id"]

    # 5. Check Readiness with 1 Document Uploaded -> 1/3 (33.3% Ready)
    res_ready_1 = client.get(
        f"/vault/readiness/schemes/{pm_kisan_id}", headers=headers
    )
    assert res_ready_1.status_code == 200
    data_1 = res_ready_1.json()
    assert data_1["is_ready_to_apply"] is False
    assert data_1["mandatory_available"] == 1
    assert data_1["readiness_percentage"] == 33.3

    # 6. Upload remaining documents (Bank Passbook, Land Records)
    passbook_file = io.BytesIO(b"%PDF-1.4 dummy passbook binary data")
    client.post(
        "/vault/documents/upload",
        data={"document_type": "Bank Passbook"},
        files={"file": ("passbook.pdf", passbook_file, "application/pdf")},
        headers=headers,
    )

    land_record_file = io.BytesIO(b"%PDF-1.4 dummy khasra khatauni binary data")
    client.post(
        "/vault/documents/upload",
        data={"document_type": "Land Records"},
        files={"file": ("land_record.pdf", land_record_file, "application/pdf")},
        headers=headers,
    )

    # 7. Check Readiness with All 3 Documents Uploaded -> 3/3 (100% Ready)
    res_ready_full = client.get(
        f"/vault/readiness/schemes/{pm_kisan_id}", headers=headers
    )
    assert res_ready_full.status_code == 200
    full_data = res_ready_full.json()
    assert full_data["is_ready_to_apply"] is True
    assert full_data["mandatory_available"] == 3
    assert full_data["mandatory_total"] == 3
    assert full_data["readiness_percentage"] == 100.0
    assert "100% application ready" in full_data["summary"]

    for item in full_data["checklist"]:
        assert item["status"] == "available"
        assert item["matched_vault_document_id"] is not None

    # 8. List Vault Documents
    res_list = client.get("/vault/documents", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 3

    # 9. Delete a Document
    res_del = client.delete(f"/vault/documents/{doc1_id}", headers=headers)
    assert res_del.status_code == 204

    res_list_after = client.get("/vault/documents", headers=headers)
    assert len(res_list_after.json()) == 2
