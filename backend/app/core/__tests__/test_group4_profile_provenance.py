from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.service import record_citizen_fact
from app.modules.vault.schemas import ConfirmFactsAndSyncProfileRequest
from app.modules.vault.service import confirm_and_sync_profile_from_facts


def create_test_user(client: TestClient, email: str) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={"email": email, "phone": "+919123456789", "password": "Password123!"},
    )
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


def test_citizen_fact_provenance_schema_fields(client: TestClient, db_session: Session):
    user_data = create_test_user(client, "fact.provenance@example.com")
    user_id = user_data["user_id"]

    # Record fact with explicit provenance fields
    record_citizen_fact(
        db=db_session,
        user_id=user_id,
        fact_key="state",
        fact_value="Madhya Pradesh",
        source_type="document_ocr",
        confidence_score=0.95,
        status="verified",
    )
    db_session.commit()

    # Get verified facts audit via API
    res_facts = client.get("/users/me/facts", headers=user_data["headers"])
    assert res_facts.status_code == 200
    data = res_facts.json()
    assert data["total_facts"] == 1
    hist_item = data["fact_history"][0]
    assert hist_item["source_type"] == "document_ocr"
    assert hist_item["confidence_score"] == 0.95
    assert hist_item["status"] == "verified"


def test_cross_verification_requires_distinct_doc_types(client: TestClient, db_session: Session):
    from app.modules.vault.models import UserDocument

    user_data = create_test_user(client, "cross.verify@example.com")
    user_id = user_data["user_id"]

    # Create 2 documents of SAME document type (Aadhaar Card)
    doc1 = UserDocument(
        user_id=user_id,
        document_type="Aadhaar Card",
        file_key="key1",
        file_name="aadhaar1.pdf",
        file_size_bytes=100,
        mime_type="application/pdf",
        is_verified=True,
    )
    doc2 = UserDocument(
        user_id=user_id,
        document_type="Aadhaar Card",
        file_key="key2",
        file_name="aadhaar2.pdf",
        file_size_bytes=100,
        mime_type="application/pdf",
        is_verified=True,
    )
    # Create 1 document of DIFFERENT document type (Income Certificate)
    doc3 = UserDocument(
        user_id=user_id,
        document_type="Income Certificate",
        file_key="key3",
        file_name="income.pdf",
        file_size_bytes=100,
        mime_type="application/pdf",
        is_verified=True,
    )
    db_session.add_all([doc1, doc2, doc3])
    db_session.commit()

    # 1. Add 2 facts from same document type (Aadhaar)
    record_citizen_fact(
        db=db_session,
        user_id=user_id,
        fact_key="annual_income",
        fact_value="150000",
        source_document_id=doc1.id,
        source_type="document_ocr",
    )
    record_citizen_fact(
        db=db_session,
        user_id=user_id,
        fact_key="annual_income",
        fact_value="150000",
        source_document_id=doc2.id,
        source_type="document_ocr",
    )
    db_session.commit()

    # Verify that 2 uploads of SAME document type do NOT mark is_cross_verified = True
    res1 = client.get("/users/me/facts", headers=user_data["headers"])
    assert res1.status_code == 200
    prov1 = res1.json()["provenance_by_fact"]["annual_income"]
    assert prov1["is_cross_verified"] is False

    # 2. Add 3rd fact from DIFFERENT document type (Income Certificate)
    record_citizen_fact(
        db=db_session,
        user_id=user_id,
        fact_key="annual_income",
        fact_value="150000",
        source_document_id=doc3.id,
        source_type="document_ocr",
    )
    db_session.commit()

    # Verify that 2 DISTINCT document types DO mark is_cross_verified = True
    res2 = client.get("/users/me/facts", headers=user_data["headers"])
    assert res2.status_code == 200
    prov2 = res2.json()["provenance_by_fact"]["annual_income"]
    assert prov2["is_cross_verified"] is True


def test_profile_sync_from_facts(client: TestClient, db_session: Session):
    user_data = create_test_user(client, "profile.sync@example.com")
    user_id = user_data["user_id"]

    req_payload = ConfirmFactsAndSyncProfileRequest(
        full_name="Rajesh Patel",
        date_of_birth="1985-08-20",
        gender="male",
        state="Gujarat",
        district="Ahmedabad",
        annual_income=180000,
        occupation="farmer",
    )

    res_sync = confirm_and_sync_profile_from_facts(
        db=db_session,
        user_id=user_id,
        payload=req_payload,
    )
    assert res_sync.status == "synced"
    assert len(res_sync.synced_fields) >= 5

    # Check profile
    res_prof = client.get("/users/me/profile", headers=user_data["headers"])
    assert res_prof.status_code == 200
    assert res_prof.json()["full_name"] == "Rajesh Patel"
