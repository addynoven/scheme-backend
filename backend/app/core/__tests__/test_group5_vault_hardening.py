import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user
from app.modules.vault.models import UserDocument
from app.modules.vault.service import evaluate_document_readiness, upload_user_document


def create_test_citizen(client: TestClient, email: str) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={"email": email, "phone": "+919111222333", "password": "Password123!"},
    )
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


def test_magic_byte_validation_rejects_fake_files(client: TestClient):
    citizen = create_test_citizen(client, "magic.bytes@example.com")

    # 1. Fake executable binary pretending to be PDF
    fake_exec_file = io.BytesIO(b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00")
    res_fake = client.post(
        "/vault/documents/upload",
        data={"document_type": "Aadhaar Card"},
        files={"file": ("malicious.exe", fake_exec_file, "application/pdf")},
        headers=citizen["headers"],
    )
    assert res_fake.status_code == 400
    assert "Invalid or unsupported file type" in res_fake.json()["message"] or "error" in res_fake.json()

    # 2. Valid PDF binary header (%PDF-)
    valid_pdf = io.BytesIO(b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF")
    res_valid = client.post(
        "/vault/documents/upload",
        data={"document_type": "Aadhaar Card"},
        files={"file": ("valid_aadhaar.pdf", valid_pdf, "application/pdf")},
        headers=citizen["headers"],
    )
    assert res_valid.status_code == 201
    assert res_valid.json()["document_type"] == "Aadhaar Card"


def test_document_readiness_requires_is_verified(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates a scheme requiring 'Aadhaar Card'
    res_scheme = client.post(
        "/admin/schemes",
        json={
            "name": "Mandatory Verified Scheme",
            "slug": "mandatory-verified-scheme",
            "ministry": "Ministry of Vault Testing",
            "description": "Requires verified Aadhaar",
            "status": "active",
            "required_documents": [
                {
                    "document_name": "Aadhaar Card",
                    "description": "Identity proof",
                    "is_mandatory": True,
                }
            ],
        },
        headers=admin_headers,
    )
    scheme_id = res_scheme.json()["id"]

    citizen = create_test_citizen(client, "readiness.verified@example.com")
    user_id = citizen["user_id"]

    # 2. Upload Aadhaar Card (is_verified defaults to False)
    valid_pdf = io.BytesIO(b"%PDF-1.4\nSample Aadhaar Binary")
    client.post(
        "/vault/documents/upload",
        data={"document_type": "Aadhaar Card"},
        files={"file": ("aadhaar.pdf", valid_pdf, "application/pdf")},
        headers=citizen["headers"],
    )

    # 3. Evaluate readiness -> Should report 'pending_verification' and 0% readiness
    res_readiness_unverified = client.get(
        f"/vault/readiness/schemes/{scheme_id}",
        headers=citizen["headers"],
    )
    assert res_readiness_unverified.status_code == 200
    data_unverified = res_readiness_unverified.json()
    assert data_unverified["is_ready_to_apply"] is False
    assert data_unverified["readiness_percentage"] == 0.0
    assert data_unverified["checklist"][0]["status"] == "pending_verification"

    # 4. Mark document as verified in DB
    doc = db_session.query(UserDocument).filter(UserDocument.user_id == user_id).first()
    doc.is_verified = True
    db_session.commit()

    # 5. Evaluate readiness -> Should report 'available' and 100% readiness
    res_readiness_verified = client.get(
        f"/vault/readiness/schemes/{scheme_id}",
        headers=citizen["headers"],
    )
    assert res_readiness_verified.status_code == 200
    data_verified = res_readiness_verified.json()
    assert data_verified["is_ready_to_apply"] is True
    assert data_verified["readiness_percentage"] == 100.0
    assert data_verified["checklist"][0]["status"] == "available"


def test_download_endpoint_returns_307_redirect(client: TestClient):
    citizen = create_test_citizen(client, "download.redirect@example.com")

    # Upload valid PDF
    valid_pdf = io.BytesIO(b"%PDF-1.4\nSample Document")
    res_upload = client.post(
        "/vault/documents/upload",
        data={"document_type": "Bank Passbook"},
        files={"file": ("passbook.pdf", valid_pdf, "application/pdf")},
        headers=citizen["headers"],
    )
    doc_id = res_upload.json()["id"]

    # Request download without following redirects
    res_dl = client.get(
        f"/vault/documents/{doc_id}/download",
        headers=citizen["headers"],
        follow_redirects=False,
    )
    assert res_dl.status_code == 307
    assert "location" in res_dl.headers or "Location" in res_dl.headers
