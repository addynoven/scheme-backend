from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.admin.models import RoleChangeAudit
from app.modules.auth.models import User


def create_admin_user(db: Session, email="group1.admin@gov.in") -> dict[str, str]:
    admin_user = User(
        email=email,
        phone="+919999000001",
        hashed_password=hash_password("AdminPass123!"),
        role="admin",
        is_verified=True,
    )
    db.add(admin_user)
    db.commit()
    return {"email": email, "password": "AdminPass123!"}


def create_citizen_user(client: TestClient, email: str, phone: str) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={
            "email": email,
            "phone": phone,
            "password": "CitizenPass123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": "CitizenPass123!",
        },
    )
    token = res_login.json()["access_token"]
    user_id = res_login.json().get("user_id") or 1
    return {"token": token, "headers": {"Authorization": f"Bearer {token}"}, "email": email}


def test_schemes_write_endpoints_authorization(client: TestClient, db_session: Session):
    scheme_payload = {
        "name": "Group1 Test Scheme",
        "slug": "group1-test-scheme",
        "ministry": "Ministry of Testing",
        "description": "Test scheme for authorization",
        "status": "active",
    }

    # 1. Unauthenticated creation fails 401
    res_unauth = client.post("/schemes", json=scheme_payload)
    assert res_unauth.status_code == 401

    # 2. Non-admin citizen creation fails 403
    citizen = create_citizen_user(client, "citizen.schemes@example.com", "+919888800001")
    res_citizen = client.post("/schemes", json=scheme_payload, headers=citizen["headers"])
    assert res_citizen.status_code == 403

    # 3. Admin creation succeeds 201
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_admin = client.post("/schemes", json=scheme_payload, headers=admin_headers)
    assert res_admin.status_code == 201
    scheme_id = res_admin.json()["id"]

    # 4. Patch & Delete require admin
    res_patch_unauth = client.patch(f"/schemes/{scheme_id}", json={"name": "Hacked"})
    assert res_patch_unauth.status_code == 401

    res_patch_citizen = client.patch(f"/schemes/{scheme_id}", json={"name": "Hacked"}, headers=citizen["headers"])
    assert res_patch_citizen.status_code == 403

    res_patch_admin = client.patch(f"/schemes/{scheme_id}", json={"name": "Updated Name"}, headers=admin_headers)
    assert res_patch_admin.status_code == 200

    res_del_citizen = client.delete(f"/schemes/{scheme_id}", headers=citizen["headers"])
    assert res_del_citizen.status_code == 403

    res_del_admin = client.delete(f"/schemes/{scheme_id}", headers=admin_headers)
    assert res_del_admin.status_code == 204


def test_users_endpoints_authorization(client: TestClient, db_session: Session):
    citizen_a = create_citizen_user(client, "usera@example.com", "+919777700001")
    citizen_b = create_citizen_user(client, "userb@example.com", "+919777700002")

    admin_creds = create_admin_user(db_session, "user.admin@gov.in")
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Unauthenticated /users list fails 401
    assert client.get("/users").status_code == 401

    # 2. Citizen /users list fails 403
    assert client.get("/users", headers=citizen_a["headers"]).status_code == 403

    # 3. Admin /users list succeeds 200
    res_list = client.get("/users", headers=admin_headers)
    assert res_list.status_code == 200

    # Get User B ID
    user_b_id = next(u["id"] for u in res_list.json()["items"] if u["email"] == "userb@example.com")
    user_a_id = next(u["id"] for u in res_list.json()["items"] if u["email"] == "usera@example.com")

    # 4. User A accessing User B's profile/user fails 403
    assert client.get(f"/users/{user_b_id}", headers=citizen_a["headers"]).status_code == 403
    assert client.patch(f"/users/{user_b_id}", json={"phone": "+910000000000"}, headers=citizen_a["headers"]).status_code == 403
    assert client.get(f"/users/{user_b_id}/profile", headers=citizen_a["headers"]).status_code == 403

    # 5. User A accessing own record succeeds
    assert client.get(f"/users/{user_a_id}", headers=citizen_a["headers"]).status_code == 200


def test_chat_session_idor_and_guest_token(client: TestClient):
    citizen_a = create_citizen_user(client, "chat.usera@example.com", "+919666600001")
    citizen_b = create_citizen_user(client, "chat.userb@example.com", "+919666600002")

    # 1. Citizen A creates a chat session
    res_sess = client.post("/chat/sessions", json={"title": "Private Chat A"}, headers=citizen_a["headers"])
    assert res_sess.status_code == 201
    session_id = res_sess.json()["id"]

    # 2. Citizen B attempting to read Citizen A's session fails 403
    assert client.get(f"/chat/sessions/{session_id}", headers=citizen_b["headers"]).status_code == 403

    # 3. Citizen B attempting to delete Citizen A's session fails 403
    assert client.delete(f"/chat/sessions/{session_id}", headers=citizen_b["headers"]).status_code == 403

    # 4. Guest creates session with X-Guest-Token
    guest_headers = {"X-Guest-Token": "secret_guest_token_123"}
    res_guest = client.post("/chat/sessions", json={"title": "Guest Chat"}, headers=guest_headers)
    assert res_guest.status_code == 201
    guest_sess_id = res_guest.json()["id"]

    # 5. Unauthenticated call without guest token fails 403
    assert client.get(f"/chat/sessions/{guest_sess_id}").status_code == 403

    # 6. Unauthenticated call with wrong guest token fails 403
    assert client.get(f"/chat/sessions/{guest_sess_id}", headers={"X-Guest-Token": "wrong_secret"}).status_code == 403

    # 7. Unauthenticated call with correct guest token succeeds
    assert client.get(f"/chat/sessions/{guest_sess_id}", headers=guest_headers).status_code == 200


def test_admin_role_elevation_audit_logging(client: TestClient, db_session: Session):
    citizen = create_citizen_user(client, "role.target@example.com", "+919555500001")
    admin_creds = create_admin_user(db_session, "role.actor@gov.in")
    admin_token = client.post("/auth/login", json=admin_creds).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Get target user ID
    res_users = client.get("/admin/users", headers=admin_headers)
    target_user_id = next(u["id"] for u in res_users.json()["items"] if u["email"] == "role.target@example.com")

    # Elevate role
    res_elevate = client.patch(f"/admin/users/{target_user_id}/role", json={"role": "admin"}, headers=admin_headers)
    assert res_elevate.status_code == 200

    # Verify audit log in DB
    audit = db_session.query(RoleChangeAudit).filter(RoleChangeAudit.target_user_id == target_user_id).first()
    assert audit is not None
    assert audit.previous_role == "citizen"
    assert audit.new_role == "admin"


def test_household_member_authorization(client: TestClient):
    citizen_a = create_citizen_user(client, "household.usera@example.com", "+919444400001")
    citizen_b = create_citizen_user(client, "household.userb@example.com", "+919444400002")

    # User A adds a household member
    member_payload = {
        "full_name": "Child A",
        "relationship": "daughter",
        "date_of_birth": "2015-05-10",
        "gender": "female",
    }
    res_add = client.post("/household/members", json=member_payload, headers=citizen_a["headers"])
    assert res_add.status_code == 201
    member_id = res_add.json()["id"]

    # User B attempting to get/update/delete User A's household member fails 403
    assert client.get(f"/household/members/{member_id}", headers=citizen_b["headers"]).status_code == 403
    assert client.put(f"/household/members/{member_id}", json={"full_name": "Hacked"}, headers=citizen_b["headers"]).status_code == 403
    assert client.delete(f"/household/members/{member_id}", headers=citizen_b["headers"]).status_code == 403

    # User A can get member successfully
    assert client.get(f"/household/members/{member_id}", headers=citizen_a["headers"]).status_code == 200
