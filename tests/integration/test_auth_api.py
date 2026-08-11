from fastapi.testclient import TestClient


def test_user_registration_and_login_flow(client: TestClient):
    # 1. Register User
    register_payload = {
        "email": "citizen.rahul@example.com",
        "phone": "+919876543211",
        "password": "SecurePassword123!",
    }
    res_reg = client.post("/auth/register", json=register_payload)
    assert res_reg.status_code == 201
    user_data = res_reg.json()
    assert user_data["email"] == "citizen.rahul@example.com"
    assert "hashed_password" not in user_data
    assert "password" not in user_data

    # 2. Duplicate Registration Should Fail
    res_dup = client.post("/auth/register", json=register_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Login with Invalid Password
    res_bad_login = client.post(
        "/auth/login",
        json={
            "email": "citizen.rahul@example.com",
            "password": "WrongPassword!",
        },
    )
    assert res_bad_login.status_code == 401

    # 4. Login with Valid Credentials
    res_login = client.post(
        "/auth/login",
        json={
            "email": "citizen.rahul@example.com",
            "password": "SecurePassword123!",
        },
    )
    assert res_login.status_code == 200
    tokens = res_login.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["token_type"] == "bearer"
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 5. Access /auth/me with Bearer Token
    headers = {"Authorization": f"Bearer {access_token}"}
    res_me = client.get("/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "citizen.rahul@example.com"

    # 6. Access /auth/me without Token Should Fail 401
    res_unauth = client.get("/auth/me")
    assert res_unauth.status_code == 401

    # 7. Token Refresh
    res_refresh = client.post(
        "/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert res_refresh.status_code == 200
    new_tokens = res_refresh.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens

    # 8. Token Refresh with Bad Token Should Fail 401
    res_bad_refresh = client.post(
        "/auth/refresh", json={"refresh_token": "invalid.jwt.token"}
    )
    assert res_bad_refresh.status_code == 401


def test_authenticated_profile_and_eligibility_flow(client: TestClient):
    # Setup Scheme: PM Kisan
    client.post(
        "/schemes",
        json={
            "name": "PM Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "ministry": "Ministry of Agriculture",
            "description": "Farmer support",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "occupation",
                    "operator": "eq",
                    "rule_value": "farmer",
                },
                {
                    "field_name": "annual_income",
                    "operator": "lte",
                    "rule_value": "200000",
                },
            ],
        },
    )

    # 1. Register & Login
    client.post(
        "/auth/register",
        json={
            "email": "kisan.suresh@example.com",
            "phone": "+919876543222",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "kisan.suresh@example.com",
            "password": "Password123!",
        },
    )
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Before profile creation: /users/me/profile returns 404
    res_no_prof = client.get("/users/me/profile", headers=headers)
    assert res_no_prof.status_code == 404

    # 3. Create profile via /users/me/profile
    profile_data = {
        "full_name": "Suresh Yadav",
        "date_of_birth": "1988-04-12",
        "gender": "male",
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "annual_income": 120000,
        "occupation": "farmer",
    }
    res_create_prof = client.post(
        "/users/me/profile", json=profile_data, headers=headers
    )
    assert res_create_prof.status_code == 200
    assert res_create_prof.json()["full_name"] == "Suresh Yadav"

    # 4. Get profile via /users/me/profile
    res_get_prof = client.get("/users/me/profile", headers=headers)
    assert res_get_prof.status_code == 200
    assert res_get_prof.json()["occupation"] == "farmer"

    # 5. Check my eligible schemes via /eligibility/me/schemes
    res_eligible = client.get("/eligibility/me/schemes", headers=headers)
    assert res_eligible.status_code == 200
    matched = res_eligible.json()
    assert len(matched) == 1
    assert matched[0]["slug"] == "pm-kisan"

    # 6. Update profile to non-farmer occupation
    client.patch(
        "/users/me/profile",
        json={"occupation": "accountant"},
        headers=headers,
    )

    # 7. Check eligibility again -> should be 0 schemes
    res_eligible_after = client.get(
        "/eligibility/me/schemes", headers=headers
    )
    assert res_eligible_after.status_code == 200
    assert len(res_eligible_after.json()) == 0
