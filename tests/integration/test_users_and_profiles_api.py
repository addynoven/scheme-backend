from fastapi.testclient import TestClient


def test_user_and_profile_lifecycle_with_cascade(client: TestClient):
    user_payload = {
        "email": "farmer.ramesh@example.com",
        "phone": "+919876543210",
    }

    # 1. Create User
    res = client.post("/users", json=user_payload)
    assert res.status_code == 201
    user_data = res.json()
    user_id = user_data["id"]
    assert user_data["email"] == "farmer.ramesh@example.com"

    # 2. Duplicate email should fail
    res_dup = client.post("/users", json=user_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Create Profile
    profile_payload = {
        "full_name": "Ramesh Kumar",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "state": "Maharashtra",
        "district": "Pune",
        "annual_income": 150000,
        "occupation": "farmer",
    }
    res_prof = client.post(f"/users/{user_id}/profile", json=profile_payload)
    assert res_prof.status_code == 200
    assert res_prof.json()["full_name"] == "Ramesh Kumar"
    assert res_prof.json()["user_id"] == user_id

    # 4. Get User With Profile
    res_user = client.get(f"/users/{user_id}")
    assert res_user.status_code == 200
    user_with_prof = res_user.json()
    assert user_with_prof["profile"] is not None
    assert user_with_prof["profile"]["occupation"] == "farmer"

    # 5. List Users with Pagination
    res_list = client.get("/users?skip=0&limit=10")
    assert res_list.status_code == 200
    list_data = res_list.json()
    assert list_data["total"] == 1
    assert len(list_data["items"]) == 1

    # 6. Update Profile
    res_prof_patch = client.patch(
        f"/users/{user_id}/profile",
        json={"annual_income": 160000},
    )
    assert res_prof_patch.status_code == 200
    assert res_prof_patch.json()["annual_income"] == 160000

    # 7. Delete User - Cascade should safely remove User AND Profile without constraint error
    res_del = client.delete(f"/users/{user_id}")
    assert res_del.status_code == 204

    # 8. Confirm User is gone
    res_user_after = client.get(f"/users/{user_id}")
    assert res_user_after.status_code == 404

    # 9. Confirm Profile is also deleted
    res_prof_after = client.get(f"/users/{user_id}/profile")
    assert res_prof_after.status_code == 404
