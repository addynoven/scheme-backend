from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.auth.models import Profile, User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Benefit, EligibilityRule, Scheme


@pytest.fixture
def auth_user_and_token(client: TestClient, db_session: Session):
    user = User(
        email="farmer.family@gov.in",
        phone="9876543210",
        role="citizen",
        is_verified=True,
        hashed_password=hash_password("FarmerPass123!"),
    )
    db_session.add(user)
    db_session.flush()

    profile = Profile(
        user_id=user.id,
        full_name="Ramesh Yadav",
        date_of_birth=date(1976, 5, 10),
        state="Madhya Pradesh",
        district="Indore",
        gender="male",
        annual_income=120000,
        occupation="farmer",
        caste_category="OBC",
    )
    db_session.add(profile)
    db_session.commit()

    login_res = client.post(
        "/auth/login",
        json={"email": "farmer.family@gov.in", "password": "FarmerPass123!"},
    )
    token = login_res.json()["access_token"]
    return user, token


@pytest.fixture
def seed_family_schemes(db_session: Session):
    # Scheme 1: PM Kisan (Father: Farmer)
    s1 = Scheme(
        name="PM Kisan",
        slug="pm-kisan",
        state="ALL_INDIA",
        category="Agriculture",
        ministry="Ministry of Agriculture",
        description="Income support for farmer families",
    )
    db_session.add(s1)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s1.id, field_name="occupation", operator="eq", rule_value="farmer"))
    db_session.add(Benefit(scheme_id=s1.id, title="₹6,000 Annual Direct Cash", description="Cash"))

    # Scheme 2: Ladli Behna (Wife: Female, MP, 21-60)
    s2 = Scheme(
        name="Ladli Behna",
        slug="ladli-behna",
        state="Madhya Pradesh",
        category="Women & Child",
        ministry="Women and Child Development Department MP",
        description="Monthly financial support for women in MP",
    )
    db_session.add(s2)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s2.id, field_name="gender", operator="eq", rule_value="female"))
    db_session.add(EligibilityRule(scheme_id=s2.id, field_name="age", operator="gte", rule_value="21"))
    db_session.add(EligibilityRule(scheme_id=s2.id, field_name="age", operator="lte", rule_value="60"))
    db_session.add(Benefit(scheme_id=s2.id, title="₹1,250 Monthly DBT", description="Cash"))

    # Scheme 3: Sukanya Samriddhi (Daughter: Female, Age <= 10)
    s3 = Scheme(
        name="Sukanya Samriddhi",
        slug="sukanya-samriddhi",
        state="ALL_INDIA",
        category="Women & Child",
        ministry="Ministry of Finance",
        description="Savings scheme for girl child",
    )
    db_session.add(s3)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s3.id, field_name="gender", operator="eq", rule_value="female"))
    db_session.add(EligibilityRule(scheme_id=s3.id, field_name="age", operator="lte", rule_value="10"))
    db_session.add(Benefit(scheme_id=s3.id, title="High Interest Tax-Free Savings", description="Savings"))

    db_session.commit()
    bitmask_engine.warm_up(db_session)


def test_household_member_crud_and_family_eligibility_scan(
    client: TestClient, auth_user_and_token, seed_family_schemes
):
    user, token = auth_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add Wife
    wife_payload = {
        "full_name": "Sunita Yadav",
        "relationship": "spouse",
        "age": 44,
        "gender": "female",
        "occupation": "homemaker",
    }
    res_wife = client.post("/household/members", json=wife_payload, headers=headers)
    assert res_wife.status_code == 201
    wife_id = res_wife.json()["id"]

    # 2. Add 8-year-old Daughter
    daughter_payload = {
        "full_name": "Pooja Yadav",
        "relationship": "daughter",
        "age": 8,
        "gender": "female",
        "occupation": "student",
        "is_student": True,
    }
    res_daughter = client.post("/household/members", json=daughter_payload, headers=headers)
    assert res_daughter.status_code == 201
    daughter_id = res_daughter.json()["id"]

    # 3. List Members
    res_list = client.get("/household/members", headers=headers)
    assert res_list.status_code == 200
    members = res_list.json()
    assert len(members) == 2

    # 4. Single-Click Family-Wide Eligibility Scan
    res_scan = client.get("/household/eligibility", headers=headers)
    assert res_scan.status_code == 200
    scan_data = res_scan.json()

    assert scan_data["total_family_members"] == 2
    assert scan_data["total_collective_schemes"] >= 2

    reports = scan_data["family_members_reports"]
    # Wife should match Ladli Behna
    wife_report = next(r for r in reports if r["member_id"] == wife_id)
    assert any(s["slug"] == "ladli-behna" for s in wife_report["eligible_schemes"])

    # Daughter should match Sukanya Samriddhi
    daughter_report = next(r for r in reports if r["member_id"] == daughter_id)
    assert any(s["slug"] == "sukanya-samriddhi" for s in daughter_report["eligible_schemes"])

    # 5. Delete Member
    res_del = client.delete(f"/household/members/{daughter_id}", headers=headers)
    assert res_del.status_code == 204
