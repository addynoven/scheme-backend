from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user


def setup_multi_match_schemes(client: TestClient, db_session: Session) -> dict[str, str]:
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    schemes = [
        {
            "name": "Post-Matric Scholarship Scheme",
            "slug": "post-matric-scholarship",
            "ministry": "Ministry of Social Justice and Empowerment",
            "description": "Financial assistance for students in higher education",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "occupation",
                    "operator": "eq",
                    "rule_value": "student",
                },
                {
                    "field_name": "annual_income",
                    "operator": "lte",
                    "rule_value": "250000",
                },
                {
                    "field_name": "age",
                    "operator": "between",
                    "rule_value": "15-30",
                },
            ],
        },
        {
            "name": "Mahila Samman Skill Assistance",
            "slug": "mahila-samman",
            "ministry": "Ministry of Women and Child Development",
            "description": "Empowerment allowance for young women",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "gender",
                    "operator": "eq",
                    "rule_value": "female",
                },
                {
                    "field_name": "annual_income",
                    "operator": "lte",
                    "rule_value": "100000",
                },
                {
                    "field_name": "age",
                    "operator": "between",
                    "rule_value": "18-50",
                },
            ],
        },
        {
            "name": "PM Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "ministry": "Ministry of Agriculture",
            "description": "Income support for farmers",
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
    ]

    for s in schemes:
        client.post("/schemes", json=s, headers=admin_headers)

    return admin_headers


def test_multi_scheme_match_female_student(client: TestClient, db_session: Session):
    admin_headers = setup_multi_match_schemes(client, db_session)

    # 18-year-old female student with 50,000 annual income
    # Should qualify for BOTH Post-Matric Scholarship AND Mahila Samman
    res_user = client.post(
        "/users",
        json={"email": "ananya.student@test.com", "phone": "+919999977777"},
        headers=admin_headers,
    )
    user_id = res_user.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Ananya Roy",
            "date_of_birth": "2008-01-01",
            "gender": "female",
            "state": "West Bengal",
            "district": "Kolkata",
            "annual_income": 50000,
            "occupation": "student",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched = res_eligible.json()
    matched_slugs = [s["slug"] for s in matched]

    # Verify multiple scheme matches
    assert len(matched) == 2
    assert "post-matric-scholarship" in matched_slugs
    assert "mahila-samman" in matched_slugs
    assert "pm-kisan" not in matched_slugs


def test_exact_income_boundary_cutoff(client: TestClient, db_session: Session):
    setup_multi_match_schemes(client, db_session)

    # PM Kisan cutoff is 200,000
    # Case A: Income exactly 200,000 (Passes)
    res_pass = client.post(
        "/eligibility/check",
        json={"occupation": "farmer", "annual_income": 200000},
    )
    assert res_pass.status_code == 200
    slugs_pass = [s["slug"] for s in res_pass.json()]
    assert "pm-kisan" in slugs_pass

    # Case B: Income 200,001 (1 Rupee above cutoff -> Fails)
    res_fail = client.post(
        "/eligibility/check",
        json={"occupation": "farmer", "annual_income": 200001},
    )
    assert res_fail.status_code == 200
    slugs_fail = [s["slug"] for s in res_fail.json()]
    assert "pm-kisan" not in slugs_fail


def test_exact_age_boundary_cutoff(client: TestClient, db_session: Session):
    setup_multi_match_schemes(client, db_session)

    # Mahila Samman age rule is between 18-50
    # Case A: Exactly age 18 (Passes lower bound)
    res_18 = client.post(
        "/eligibility/check",
        json={"gender": "female", "annual_income": 50000, "age": 18},
    )
    assert "mahila-samman" in [s["slug"] for s in res_18.json()]

    # Case B: Age 17 (Fails lower bound)
    res_17 = client.post(
        "/eligibility/check",
        json={"gender": "female", "annual_income": 50000, "age": 17},
    )
    assert "mahila-samman" not in [s["slug"] for s in res_17.json()]

    # Case C: Exactly age 50 (Passes upper bound)
    res_50 = client.post(
        "/eligibility/check",
        json={"gender": "female", "annual_income": 50000, "age": 50},
    )
    assert "mahila-samman" in [s["slug"] for s in res_50.json()]

    # Case D: Age 51 (Fails upper bound)
    res_51 = client.post(
        "/eligibility/check",
        json={"gender": "female", "annual_income": 50000, "age": 51},
    )
    assert "mahila-samman" not in [s["slug"] for s in res_51.json()]
