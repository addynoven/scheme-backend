import io
import random
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.modules.schemes.models import Scheme, EligibilityRule, Benefit
from app.modules.eligibility.bitmask_engine import bitmask_engine


def test_saas_3tier_identity_and_life_stage_lifecycle(client: TestClient, db_session: Session):
    # Seed a test scheme for family welfare
    s1 = Scheme(
        name="Sukanya Samriddhi & Child Welfare",
        slug="sukanya-samriddhi",
        state="ALL_INDIA",
        category="Women & Child",
        ministry="Ministry of Women and Child",
        description="Support for daughters and women",
    )
    db_session.add(s1)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s1.id, field_name="gender", operator="eq", rule_value="female"))
    db_session.add(Benefit(scheme_id=s1.id, title="Financial Grant", description="Support"))
    db_session.commit()
    bitmask_engine.warm_up(db_session)

    suffix = uuid.uuid4().hex[:6]
    email = f"rajesh_{suffix}@example.com"
    phone = f"+9198{random.randint(10000000, 99999999)}"

    # 1. Register Primary Citizen
    reg_payload = {
        "email": email,
        "phone": phone,
        "password": "Password123!",
    }
    res = client.post("/auth/register", json=reg_payload)
    assert res.status_code == 201, res.text
    user_info = res.json()

    # Login to get access token
    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch /auth/me to verify UIDs
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()

    assert me_data["citizen_uid"] is not None
    assert me_data["citizen_uid"].startswith("CIT-")
    assert me_data["household_uid"] is not None
    assert me_data["household_uid"].startswith("HHD-")
    primary_hhd_uid = me_data["household_uid"]

    # 2. Setup Profile for Primary Citizen (Farmer in MP, age 42, income ₹85,000)
    profile_payload = {
        "full_name": "Rajesh Sharma",
        "date_of_birth": "1984-06-15",
        "gender": "male",
        "state": "Madhya Pradesh",
        "district": "Sehore",
        "annual_income": 85000,
        "occupation": "farmer",
        "caste_category": "OBC",
    }
    prof_res = client.post("/users/me/profile", json=profile_payload, headers=headers)
    assert prof_res.status_code == 200, prof_res.text

    # 3. Add Minor Family Member (Daughter Pooja, age 14 -> MINOR)
    daughter_payload = {
        "full_name": "Pooja Sharma",
        "relationship": "daughter",
        "age": 14,
        "date_of_birth": "2012-04-10",
        "gender": "female",
        "occupation": "student",
        "caste_category": "OBC",
        "is_student": True,
        "is_disabled": False,
    }
    d_res = client.post("/household/members", json=daughter_payload, headers=headers)
    assert d_res.status_code == 201, d_res.text
    daughter_data = d_res.json()

    assert daughter_data["citizen_uid"].startswith("CIT-")
    assert daughter_data["member_uid"].startswith("MBR-")
    assert daughter_data["household_uid"] == primary_hhd_uid
    assert daughter_data["life_stage"] == "MINOR"
    assert daughter_data["verification_status"] == "UNVERIFIED"
    daughter_id = daughter_data["id"]
    daughter_cit_uid = daughter_data["citizen_uid"]

    # 4. Add Senior Family Member (Mother Kamla Devi, age 68 -> SENIOR)
    mother_payload = {
        "full_name": "Kamla Devi",
        "relationship": "mother",
        "age": 68,
        "date_of_birth": "1958-01-01",
        "gender": "female",
        "occupation": "retired",
        "caste_category": "OBC",
        "annual_income": 0,
        "is_student": False,
        "is_disabled": False,
    }
    m_res = client.post("/household/members", json=mother_payload, headers=headers)
    assert m_res.status_code == 201, m_res.text
    mother_data = m_res.json()

    assert mother_data["citizen_uid"].startswith("CIT-")
    assert mother_data["member_uid"].startswith("MBR-")
    assert mother_data["household_uid"] == primary_hhd_uid
    assert mother_data["life_stage"] == "SENIOR"

    # 5. Upload Document to Vault Tagged Specifically to Daughter
    doc_content = b"%PDF-1.4 10th Class School Bonafide Certificate"
    doc_file = io.BytesIO(doc_content)
    upload_res = client.post(
        "/vault/documents/upload",
        headers=headers,
        data={
            "document_type": "10th Marksheet",
            "document_number_masked": "MP-SCH-9402",
            "household_member_id": str(daughter_id),
        },
        files={"file": ("pooja_10th_marksheet.pdf", doc_file, "application/pdf")},
    )
    assert upload_res.status_code == 201, upload_res.text
    doc_data = upload_res.json()
    assert doc_data["household_member_id"] == daughter_id
    assert doc_data["citizen_uid"] == daughter_cit_uid

    # 6. List Documents with Member Filter
    list_all_docs = client.get("/vault/documents", headers=headers).json()
    assert len(list_all_docs) >= 1

    list_daughter_docs = client.get(f"/vault/documents?household_member_id={daughter_id}", headers=headers).json()
    assert len(list_daughter_docs) == 1
    assert list_daughter_docs[0]["file_name"] == "pooja_10th_marksheet.pdf"

    # 7. Life-Stage Transition Test: Update Daughter's Age to 19 -> Transitions to ADULT
    update_res = client.put(
        f"/household/members/{daughter_id}",
        json={"age": 19, "date_of_birth": "2007-04-10"},
        headers=headers,
    )
    assert update_res.status_code == 200, update_res.text
    updated_daughter = update_res.json()
    assert updated_daughter["age"] == 19
    assert updated_daughter["life_stage"] == "ADULT"

    # 8. Single-Click Family Welfare Scan
    scan_res = client.get("/household/eligibility", headers=headers)
    assert scan_res.status_code == 200, scan_res.text
    scan_data = scan_res.json()

    assert scan_data["household_uid"] == primary_hhd_uid
    assert scan_data["total_family_members"] == 2
    assert scan_data["total_collective_schemes"] > 0

    reports = scan_data["family_members_reports"]
    assert len(reports) == 2
    assert any(r["full_name"] == "Pooja Sharma" and r["citizen_uid"].startswith("CIT-") for r in reports)
    assert any(r["full_name"] == "Kamla Devi" and r["life_stage"] == "SENIOR" for r in reports)
