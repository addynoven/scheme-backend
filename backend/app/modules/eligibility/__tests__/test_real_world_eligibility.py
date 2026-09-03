from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user


def setup_national_schemes(client: TestClient, db_session: Session) -> dict[str, str]:
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    schemes = [
        {
            "name": "PM Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "ministry": "Ministry of Agriculture",
            "description": "Direct income support of Rs 6,000/year to farmer families",
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
        {
            "name": "Sukanya Samriddhi Yojana",
            "slug": "sukanya-samriddhi",
            "ministry": "Ministry of Finance",
            "description": "Small deposit scheme for the girl child",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "gender",
                    "operator": "eq",
                    "rule_value": "female",
                },
                {
                    "field_name": "age",
                    "operator": "lte",
                    "rule_value": "10",
                },
            ],
        },
        {
            "name": "National Old Age Pension Scheme",
            "slug": "old-age-pension",
            "ministry": "Ministry of Rural Development",
            "description": "Monthly pension for destitute senior citizens",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "age",
                    "operator": "gte",
                    "rule_value": "60",
                },
                {
                    "field_name": "annual_income",
                    "operator": "lte",
                    "rule_value": "100000",
                },
            ],
        },
        {
            "name": "Post-Matric Scholarship Scheme",
            "slug": "post-matric-scholarship",
            "ministry": "Ministry of Social Justice and Empowerment",
            "description": "Financial assistance for higher education",
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
            "name": "PM Vishwakarma Scheme",
            "slug": "pm-vishwakarma",
            "ministry": "Ministry of Micro, Small and Medium Enterprises",
            "description": "Support for traditional artisans and craftspeople",
            "status": "active",
            "eligibility_rules": [
                {
                    "field_name": "occupation",
                    "operator": "in",
                    "rule_value": "carpenter, blacksmith, potter, artisan, weaver",
                },
                {
                    "field_name": "age",
                    "operator": "gte",
                    "rule_value": "18",
                },
            ],
        },
    ]

    for scheme_data in schemes:
        res = client.post("/schemes", json=scheme_data, headers=admin_headers)
        assert res.status_code == 201

    return admin_headers


def test_persona_1_farmer_ramesh(client: TestClient, db_session: Session):
    admin_headers = setup_national_schemes(client, db_session)

    # Ramesh: 42yo Farmer from Maharashtra with 1.2L income
    res = client.post(
        "/users",
        json={"email": "ramesh.farmer@test.com", "phone": "+919111111111"},
        headers=admin_headers,
    )
    user_id = res.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Ramesh Patil",
            "date_of_birth": "1984-06-10",
            "gender": "male",
            "state": "Maharashtra",
            "district": "Kolhapur",
            "annual_income": 120000,
            "occupation": "farmer",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched_slugs = [s["slug"] for s in res_eligible.json()]

    assert matched_slugs == ["pm-kisan"]


def test_persona_2_girl_child_priya(client: TestClient, db_session: Session):
    admin_headers = setup_national_schemes(client, db_session)

    # Priya: 7yo Girl child from UP
    res = client.post(
        "/users",
        json={"email": "priya.child@test.com", "phone": "+919222222222"},
        headers=admin_headers,
    )
    user_id = res.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Priya Sharma",
            "date_of_birth": "2019-03-15",
            "gender": "female",
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "annual_income": 60000,
            "occupation": "student",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched_slugs = [s["slug"] for s in res_eligible.json()]

    # Qualifies for Sukanya Samriddhi (female + age <= 10). Does not qualify for Post-Matric (age 7 < 15).
    assert matched_slugs == ["sukanya-samriddhi"]


def test_persona_3_senior_citizen_murugan(client: TestClient, db_session: Session):
    admin_headers = setup_national_schemes(client, db_session)

    # Murugan: 68yo Senior citizen with 40k income
    res = client.post(
        "/users",
        json={"email": "murugan.senior@test.com", "phone": "+919333333333"},
        headers=admin_headers,
    )
    user_id = res.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Murugan S",
            "date_of_birth": "1958-01-20",
            "gender": "male",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "annual_income": 40000,
            "occupation": "retired",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched_slugs = [s["slug"] for s in res_eligible.json()]

    assert matched_slugs == ["old-age-pension"]


def test_persona_4_rural_artisan_sunita(client: TestClient, db_session: Session):
    admin_headers = setup_national_schemes(client, db_session)

    # Sunita: 30yo Artisan weaver from Rajasthan with 1.4L income
    res = client.post(
        "/users",
        json={"email": "sunita.artisan@test.com", "phone": "+919444444444"},
        headers=admin_headers,
    )
    user_id = res.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Sunita Devi",
            "date_of_birth": "1996-08-01",
            "gender": "female",
            "state": "Rajasthan",
            "district": "Jaipur",
            "annual_income": 140000,
            "occupation": "artisan",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched_slugs = [s["slug"] for s in res_eligible.json()]

    assert matched_slugs == ["pm-vishwakarma"]


def test_persona_5_high_income_engineer_vikram(client: TestClient, db_session: Session):
    admin_headers = setup_national_schemes(client, db_session)

    # Vikram: 30yo Software Engineer with 25L income
    res = client.post(
        "/users",
        json={"email": "vikram.tech@test.com", "phone": "+919555555555"},
        headers=admin_headers,
    )
    user_id = res.json()["id"]

    client.post(
        f"/users/{user_id}/profile",
        json={
            "full_name": "Vikram Rao",
            "date_of_birth": "1996-01-01",
            "gender": "male",
            "state": "Karnataka",
            "district": "Bengaluru",
            "annual_income": 2500000,
            "occupation": "software engineer",
        },
        headers=admin_headers,
    )

    res_eligible = client.get(f"/eligibility/users/{user_id}/schemes")
    assert res_eligible.status_code == 200
    matched_slugs = [s["slug"] for s in res_eligible.json()]

    # Should match ZERO welfare schemes
    assert matched_slugs == []
