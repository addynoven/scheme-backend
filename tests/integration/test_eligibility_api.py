from fastapi.testclient import TestClient


def setup_sample_schemes(client: TestClient):
    # Scheme 1: PM Kisan (Farmers only, income <= 200000)
    client.post(
        "/schemes",
        json={
            "name": "PM Kisan",
            "slug": "pm-kisan",
            "ministry": "Agriculture",
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

    # Scheme 2: Student Scholarship (Students only, age <= 25)
    client.post(
        "/schemes",
        json={
            "name": "National Youth Scholarship",
            "slug": "national-youth-scholarship",
            "ministry": "Education",
            "description": "Student scholarship",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "occupation",
                    "operator": "eq",
                    "rule_value": "student",
                },
                {
                    "field_name": "age",
                    "operator": "lte",
                    "rule_value": "25",
                },
            ],
        },
    )


def test_adhoc_eligibility_check(client: TestClient):
    setup_sample_schemes(client)

    # Adhoc check for Farmer with 150000 income
    res_farmer = client.post(
        "/eligibility/check",
        json={"occupation": "farmer", "annual_income": 150000},
    )
    assert res_farmer.status_code == 200
    farmer_schemes = res_farmer.json()
    assert len(farmer_schemes) == 1
    assert farmer_schemes[0]["slug"] == "pm-kisan"

    # Adhoc check for Farmer with 300000 income (exceeds limit)
    res_rich_farmer = client.post(
        "/eligibility/check",
        json={"occupation": "farmer", "annual_income": 300000},
    )
    assert res_rich_farmer.status_code == 200
    assert len(res_rich_farmer.json()) == 0

    # Adhoc check for 20-year-old student using date_of_birth
    res_student = client.post(
        "/eligibility/check",
        json={"occupation": "student", "date_of_birth": "2004-01-01"},
    )
    assert res_student.status_code == 200
    student_schemes = res_student.json()
    assert len(student_schemes) == 1
    assert student_schemes[0]["slug"] == "national-youth-scholarship"


def test_user_profile_eligibility_matching(client: TestClient):
    setup_sample_schemes(client)

    # Create User
    res_user = client.post(
        "/users",
        json={"email": "student.anita@example.com", "phone": "+919876543299"},
    )
    user_id = res_user.json()["id"]

    # Create Student Profile (age 22)
    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Anita Sharma",
            "date_of_birth": "2002-01-01",
            "gender": "female",
            "state": "Delhi",
            "district": "Central Delhi",
            "annual_income": 50000,
            "occupation": "student",
        },
    )

    # Match schemes for this user
    res_match = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_match.status_code == 200
    matched = res_match.json()
    assert len(matched) == 1
    assert matched[0]["slug"] == "national-youth-scholarship"
