from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user
from app.modules.chat.tools import execute_check_eligibility
from app.modules.eligibility.bitmask_engine import bitmask_engine


def test_bitmask_engine_between_operator(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create scheme with 'between' operator rule for age 18-35
    scheme_payload = {
        "name": "Youth Skill Allowance",
        "slug": "youth-skill-allowance",
        "ministry": "Ministry of Skill Development",
        "description": "Skill allowance for youth between 18 and 35",
        "status": "active",
        "eligibility_rules": [
            {
                "field_name": "age",
                "operator": "between",
                "rule_value": "18-35",
            }
        ],
    }
    res_create = client.post("/admin/schemes", json=scheme_payload, headers=admin_headers)
    assert res_create.status_code == 201

    # Ensure engine is warmed up
    assert bitmask_engine.is_warmed

    # Age 17 -> Fails
    res_17 = bitmask_engine.evaluate({"age": 17})
    assert not any(s["slug"] == "youth-skill-allowance" for s in res_17)

    # Age 18 -> Passes (lower bound)
    res_18 = bitmask_engine.evaluate({"age": 18})
    assert any(s["slug"] == "youth-skill-allowance" for s in res_18)

    # Age 25 -> Passes
    res_25 = bitmask_engine.evaluate({"age": 25})
    assert any(s["slug"] == "youth-skill-allowance" for s in res_25)

    # Age 35 -> Passes (upper bound)
    res_35 = bitmask_engine.evaluate({"age": 35})
    assert any(s["slug"] == "youth-skill-allowance" for s in res_35)

    # Age 36 -> Fails
    res_36 = bitmask_engine.evaluate({"age": 36})
    assert not any(s["slug"] == "youth-skill-allowance" for s in res_36)


def test_bitmask_cache_invalidation_on_mutation(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates Scheme X
    res_create = client.post(
        "/admin/schemes",
        json={
            "name": "Live Cache Scheme",
            "slug": "live-cache-scheme",
            "ministry": "Ministry of Invalidation",
            "description": "Live cache test",
            "status": "active",
        },
        headers=admin_headers,
    )
    assert res_create.status_code == 201
    scheme_id = res_create.json()["id"]

    # Verify bitmask_engine immediately reflects Scheme X
    assert any(s["slug"] == "live-cache-scheme" for s in bitmask_engine.idx_to_scheme.values())

    # 2. Admin adds a rule via POST /admin/schemes/{id}/rules
    res_rule = client.post(
        f"/admin/schemes/{scheme_id}/rules",
        json={
            "field_name": "occupation",
            "operator": "eq",
            "rule_value": "farmer",
        },
        headers=admin_headers,
    )
    assert res_rule.status_code == 201

    # Verify student now fails and farmer passes immediately in bitmask_engine
    student_res = bitmask_engine.evaluate({"occupation": "student"})
    assert not any(s["slug"] == "live-cache-scheme" for s in student_res)

    farmer_res = bitmask_engine.evaluate({"occupation": "farmer"})
    assert any(s["slug"] == "live-cache-scheme" for s in farmer_res)

    # 3. Admin deletes Scheme X
    res_del = client.delete(f"/admin/schemes/{scheme_id}", headers=admin_headers)
    assert res_del.status_code == 204

    # Verify bitmask_engine immediately removed Scheme X
    assert not any(s["slug"] == "live-cache-scheme" for s in bitmask_engine.idx_to_scheme.values())


def test_scheme_dependent_missing_fields(client: TestClient, db_session: Session):
    res_check = execute_check_eligibility(
        db=db_session,
        user_profile=None,
        tool_args={"occupation": "farmer", "state": "Madhya Pradesh"},
    )
    assert res_check["status"] == "success"
    missing = res_check["missing_fields"]
    assert "occupation" not in missing
    assert "state" not in missing
