from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user
from app.modules.eligibility.models import EligibilityDecision
from app.modules.schemes.models import Scheme, SchemeVersion


def test_scheme_policy_version_snapshots(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates Scheme V1
    res_create = client.post(
        "/admin/schemes",
        json={
            "name": "Governance Test Scheme",
            "slug": "governance-test-scheme",
            "ministry": "Ministry of Policy Versioning",
            "description": "Version 1 description",
            "status": "active",
            "eligibility_rules": [
                {"field_name": "age", "operator": "gte", "rule_value": "18"}
            ],
        },
        headers=admin_headers,
    )
    assert res_create.status_code == 201
    scheme_id = res_create.json()["id"]

    # Verify SchemeVersion #1 created
    versions_1 = db_session.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme_id).all()
    assert len(versions_1) == 1
    assert versions_1[0].version_number == 1
    assert versions_1[0].description == "Version 1 description"
    assert len(versions_1[0].rule_versions) == 1

    # 2. Admin updates scheme description -> Version #2 created
    res_patch = client.patch(
        f"/admin/schemes/{scheme_id}",
        json={"description": "Version 2 description"},
        headers=admin_headers,
    )
    assert res_patch.status_code == 200

    versions_2 = db_session.query(SchemeVersion).filter(SchemeVersion.scheme_id == scheme_id).order_by(SchemeVersion.version_number.asc()).all()
    assert len(versions_2) == 2
    assert versions_2[1].version_number == 2
    assert versions_2[1].description == "Version 2 description"


def test_eligibility_decision_audit_logging(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    client.post(
        "/admin/schemes",
        json={
            "name": "Audit Decision Scheme",
            "slug": "audit-decision-scheme",
            "ministry": "Ministry of Audit",
            "description": "Audit decision test",
            "status": "active",
            "eligibility_rules": [
                {"field_name": "occupation", "operator": "eq", "rule_value": "farmer"}
            ],
        },
        headers=admin_headers,
    )

    # Execute eligibility explanation endpoint
    payload = {
        "age": 35,
        "occupation": "farmer",
        "annual_income": 120000,
    }
    res_explain = client.post("/eligibility/explain", json=payload)
    assert res_explain.status_code == 200

    # Verify EligibilityDecision audit row was saved
    decisions = db_session.query(EligibilityDecision).filter(EligibilityDecision.scheme_slug == "audit-decision-scheme").all()
    assert len(decisions) >= 1
    d = decisions[0]
    assert d.decision == "eligible"
    assert d.profile_snapshot["occupation"] == "farmer"
    assert d.match_percentage == 100.0


def test_scheme_multi_dimensional_status_fields(client: TestClient, db_session: Session):
    s = Scheme(
        name="Multi Dim Status Scheme",
        slug="multi-dim-status-scheme",
        ministry="Ministry of Status",
        description="Multi-dimensional status test",
    )
    db_session.add(s)
    db_session.commit()
    db_session.refresh(s)

    assert s.status == "active"
    assert s.publication_state == "published"
    assert s.source_freshness == "fresh"
