from fastapi.testclient import TestClient


def test_404_entity_not_found_standard_response(client: TestClient):
    res = client.get("/schemes/99999")
    assert res.status_code == 404
    data = res.json()
    assert data["error"] == "ENTITY_NOT_FOUND"
    assert "Scheme with identifier '99999' was not found" in data["message"]
    assert data["status_code"] == 404

    res_user = client.get("/users/88888")
    assert res_user.status_code == 404
    assert res_user.json()["error"] == "ENTITY_NOT_FOUND"


def test_400_duplicate_entity_standard_response(client: TestClient):
    payload = {
        "email": "unique.user@example.com",
        "phone": "+919100000000",
        "password": "Password123!",
    }
    # First time -> 201
    res1 = client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    # Second time -> 400 with DUPLICATE_ENTITY
    res2 = client.post("/auth/register", json=payload)
    assert res2.status_code == 400
    data = res2.json()
    assert data["error"] == "DUPLICATE_ENTITY"
    assert "already exists" in data["message"]
    assert data["status_code"] == 400


def test_401_authentication_error_standard_response(client: TestClient):
    res = client.post(
        "/auth/login",
        json={"email": "nonexistent@example.com", "password": "RandomPassword!"},
    )
    assert res.status_code == 401
    data = res.json()
    assert data["error"] == "AUTHENTICATION_FAILED"
    assert data["message"] == "Invalid email or password"
    assert data["status_code"] == 401


def test_401_invalid_token_standard_response(client: TestClient):
    res = client.post(
        "/auth/refresh",
        json={"refresh_token": "malformed.jwt.token"},
    )
    assert res.status_code == 401
    data = res.json()
    assert data["error"] == "INVALID_TOKEN"
    assert data["status_code"] == 401


def test_422_validation_error_standard_response(client: TestClient):
    # Missing mandatory password in login
    res = client.post(
        "/auth/login",
        json={"email": "invalid_email_format"},
    )
    assert res.status_code == 422
    data = res.json()
    assert data["error"] == "VALIDATION_ERROR"
    assert data["status_code"] == 422
