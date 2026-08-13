from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.auth.models import User


def create_admin_user(db: Session) -> dict[str, str]:
    admin_user = User(
        email="super.admin@gov.in",
        phone="+919999988888",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        is_verified=True,
    )
    db.add(admin_user)
    db.commit()
    return {"email": "super.admin@gov.in", "password": "AdminPass123!"}


def test_citizen_forbidden_on_admin_routes(client: TestClient):
    # 1. Register normal citizen
    client.post(
        "/auth/register",
        json={
            "email": "citizen.user@example.com",
            "phone": "+919111122222",
            "password": "CitizenPassword123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "citizen.user@example.com",
            "password": "CitizenPassword123!",
        },
    )
    citizen_token = res_login.json()["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # 2. Attempt to call admin routes -> 403 Forbidden
    res_create = client.post(
        "/admin/schemes",
        json={
            "name": "Unauthorized Scheme",
            "slug": "unauthorized-scheme",
            "ministry": "Ministry of Defense",
            "description": "Test",
            "status": "active",
        },
        headers=citizen_headers,
    )
    assert res_create.status_code == 403
    data = res_create.json()
    assert data["error"] == "PERMISSION_DENIED"

    # Attempt to list users via admin
    res_users = client.get("/admin/users", headers=citizen_headers)
    assert res_users.status_code == 403


def test_admin_scheme_lifecycle_and_user_role_elevation(
    client: TestClient, db_session: Session
):
    # 1. Create and Login as Admin
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    assert res_login.status_code == 200
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Admin creates a new scheme via POST /admin/schemes
    scheme_payload = {
        "name": "State Skill Initiative",
        "slug": "state-skill-initiative",
        "category": "Employment & Skills",
        "tags": "youth, training, skill, stipend",
        "ministry": "Ministry of Skill Development",
        "description": "Skill development for rural youth",
        "status": "active",
        "benefits": [
            {
                "title": "Monthly Stipend",
                "description": "₹3,000 per month during training",
            }
        ],
    }
    res_create = client.post(
        "/admin/schemes", json=scheme_payload, headers=admin_headers
    )
    assert res_create.status_code == 201
    scheme_data = res_create.json()
    scheme_id = scheme_data["id"]

    # 3. Admin adds a rule via POST /admin/schemes/{id}/rules
    res_rule = client.post(
        f"/admin/schemes/{scheme_id}/rules",
        json={
            "field_name": "age",
            "operator": "between",
            "rule_value": "18-35",
        },
        headers=admin_headers,
    )
    assert res_rule.status_code == 201
    rule_id = res_rule.json()["id"]

    # 4. Admin adds a required document via POST /admin/schemes/{id}/documents
    res_doc = client.post(
        f"/admin/schemes/{scheme_id}/documents",
        json={
            "document_name": "10th Marksheet",
            "description": "Educational qualification proof",
            "is_mandatory": True,
        },
        headers=admin_headers,
    )
    assert res_doc.status_code == 201
    doc_id = res_doc.json()["id"]

    # 5. Admin updates scheme status to draft
    res_patch = client.patch(
        f"/admin/schemes/{scheme_id}",
        json={"status": "draft"},
        headers=admin_headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["status"] == "draft"

    # 6. Admin deletes the added document and rule
    res_del_doc = client.delete(
        f"/admin/documents/{doc_id}", headers=admin_headers
    )
    assert res_del_doc.status_code == 204

    res_del_rule = client.delete(
        f"/admin/rules/{rule_id}", headers=admin_headers
    )
    assert res_del_rule.status_code == 204

    # 7. Register a normal citizen, then Admin elevates their role to 'admin'
    res_reg_citizen = client.post(
        "/auth/register",
        json={
            "email": "promoted.officer@gov.in",
            "phone": "+919444455555",
            "password": "OfficerPassword123!",
        },
    )
    citizen_id = res_reg_citizen.json()["id"]

    # Admin promotes citizen to admin
    res_promote = client.patch(
        f"/admin/users/{citizen_id}/role",
        json={"role": "admin"},
        headers=admin_headers,
    )
    assert res_promote.status_code == 200
    assert res_promote.json()["role"] == "admin"

    # 8. Promoted user logins and accesses admin routes successfully
    res_promoted_login = client.post(
        "/auth/login",
        json={
            "email": "promoted.officer@gov.in",
            "password": "OfficerPassword123!",
        },
    )
    promoted_token = res_promoted_login.json()["access_token"]
    promoted_headers = {"Authorization": f"Bearer {promoted_token}"}

    res_promoted_schemes = client.get(
        "/admin/schemes", headers=promoted_headers
    )
    assert res_promoted_schemes.status_code == 200
