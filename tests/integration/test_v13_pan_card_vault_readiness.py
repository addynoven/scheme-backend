import os
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.scheme import Scheme
from app.seeds.seed_national_schemes import seed_national_schemes


def test_v13_real_pan_card_upload_and_readiness_meter(
    client: TestClient, db_session: Session
):
    # 1. Seed schemes to have PM Mudra Yojana and others
    seed_national_schemes(db_session)

    # 2. Register and login a citizen
    res_reg = client.post(
        "/auth/register",
        json={
            "email": "pancard.holder@gov.in",
            "phone": "+919876543299",
            "password": "CitizenVaultPassword123!",
        },
    )
    assert res_reg.status_code == 201

    res_login = client.post(
        "/auth/login",
        json={
            "email": "pancard.holder@gov.in",
            "password": "CitizenVaultPassword123!",
        },
    )
    assert res_login.status_code == 200
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Read the user's real PAN card test file from /home/neon/Downloads/download.pdf
    real_pan_file_path = Path("/home/neon/Downloads/download.pdf")
    assert real_pan_file_path.exists(), "Test PAN card file /home/neon/Downloads/download.pdf must exist"
    
    with open(real_pan_file_path, "rb") as f:
        file_bytes = f.read()

    # 4. Upload Real PAN card to Citizen Document Vault
    files = {
        "file": ("download.pdf", file_bytes, "application/pdf")
    }
    data = {
        "document_type": "PAN Card",
        "document_number_masked": "ABCDE1234F",
    }
    res_upload = client.post(
        "/vault/documents/upload",
        headers=headers,
        data=data,
        files=files,
    )
    assert res_upload.status_code == 201
    doc_data = res_upload.json()
    assert doc_data["document_type"] == "PAN Card"
    assert doc_data["file_name"] == "download.pdf"
    assert doc_data["file_size_bytes"] == len(file_bytes)
    assert doc_data["mime_type"] == "application/pdf"
    assert doc_data["download_url"] is not None
    doc_id = doc_data["id"]

    # 5. List citizen's vault documents
    res_list = client.get("/vault/documents", headers=headers)
    assert res_list.status_code == 200
    vault_docs = res_list.json()
    assert len(vault_docs) == 1
    assert vault_docs[0]["id"] == doc_id
    assert vault_docs[0]["document_type"] == "PAN Card"

    # 6. Evaluate live document readiness for PM Mudra Yojana (requires PAN Card + Aadhaar + Business Proof + Bank Statement)
    mudra_scheme = db_session.query(Scheme).filter(Scheme.slug == "pm-mudra-yojana").first()
    assert mudra_scheme is not None

    res_readiness = client.get(
        f"/vault/readiness/schemes/{mudra_scheme.id}",
        headers=headers,
    )
    assert res_readiness.status_code == 200
    readiness_data = res_readiness.json()
    assert readiness_data["scheme_slug"] == "pm-mudra-yojana"
    assert readiness_data["mandatory_total"] == 4
    assert readiness_data["mandatory_available"] == 1  # PAN Card is available!
    assert readiness_data["readiness_percentage"] == 25.0
    assert readiness_data["is_ready_to_apply"] is False

    # Verify checklist items
    pan_item = next(
        (item for item in readiness_data["checklist"] if "pan" in item["document_name"].lower()),
        None,
    )
    assert pan_item is not None
    assert pan_item["status"] == "available"
    assert pan_item["matched_vault_document_id"] == doc_id
    assert pan_item["matched_vault_document_name"] == "download.pdf"

    # 7. Upload remaining 3 documents (Aadhaar, Bank Statement, Business Proof)
    mock_pdf = b"%PDF-1.4 Mock certificate"
    client.post(
        "/vault/documents/upload",
        headers=headers,
        data={"document_type": "Aadhaar Card"},
        files={"file": ("aadhaar.pdf", mock_pdf, "application/pdf")},
    )
    client.post(
        "/vault/documents/upload",
        headers=headers,
        data={"document_type": "Bank Account Statement (6 Months)"},
        files={"file": ("bank_statement.pdf", mock_pdf, "application/pdf")},
    )
    client.post(
        "/vault/documents/upload",
        headers=headers,
        data={"document_type": "Business Address Proof / Udyam Registration"},
        files={"file": ("udyam_msme.pdf", mock_pdf, "application/pdf")},
    )

    # 8. Re-evaluate readiness -> Should reach 100.0% Application Ready!
    res_full_readiness = client.get(
        f"/vault/readiness/schemes/{mudra_scheme.id}",
        headers=headers,
    )
    assert res_full_readiness.status_code == 200
    full_data = res_full_readiness.json()
    assert full_data["mandatory_available"] == 4
    assert full_data["mandatory_total"] == 4
    assert full_data["readiness_percentage"] == 100.0
    assert full_data["is_ready_to_apply"] is True
    assert "100% application ready" in full_data["summary"].lower()

    # 9. Clean up: Delete PAN card document
    res_del = client.delete(f"/vault/documents/{doc_id}", headers=headers)
    assert res_del.status_code == 204
