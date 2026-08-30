from fastapi.testclient import TestClient


def setup_explanation_schemes(client: TestClient):
    schemes = [
        {
            "name": "PM Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "ministry": "Ministry of Agriculture",
            "description": "Financial support for farmers",
            "status": "active",
            "benefits": [
                {
                    "title": "Annual ₹6,000 Assistance",
                    "description": "3 installments of ₹2,000 each",
                }
            ],
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
            "description": "Girl child savings scheme",
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
            "description": "Pension for senior citizens",
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
    ]

    for s in schemes:
        client.post("/schemes", json=s)


def test_adhoc_explain_endpoint_human_friendly_breakdown(client: TestClient):
    setup_explanation_schemes(client)

    # 45yo Male Farmer with ₹1,20,000 income
    payload = {
        "age": 45,
        "gender": "male",
        "state": "Maharashtra",
        "occupation": "farmer",
        "annual_income": 120000,
    }

    res = client.post("/eligibility/explain", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["total_evaluated"] == 3
    assert data["eligible_count"] == 1
    assert data["ineligible_count"] == 2

    # Check Eligible PM Kisan explanation
    pm_kisan = data["eligible_schemes"][0]
    assert pm_kisan["scheme_slug"] == "pm-kisan"
    assert pm_kisan["is_eligible"] is True
    assert pm_kisan["match_percentage"] == 100.0
    assert pm_kisan["criteria_passed"] == 2
    assert pm_kisan["criteria_total"] == 2
    assert "You meet all 2 eligibility criteria" in pm_kisan["summary_reason"]
    assert len(pm_kisan["passed_criteria"]) == 2
    assert len(pm_kisan["failed_criteria"]) == 0

    # Verify human-readable criteria in PM Kisan
    occupation_verdict = next(
        c for c in pm_kisan["passed_criteria"] if c["field"] == "occupation"
    )
    assert occupation_verdict["criterion_title"] == "Occupation / Livelihood"
    assert occupation_verdict["your_value"] == "Farmer"
    assert occupation_verdict["required_condition"] == "Must be Farmer"
    assert "matches the required criteria" in occupation_verdict["reason"]

    income_verdict = next(
        c for c in pm_kisan["passed_criteria"] if c["field"] == "annual_income"
    )
    assert income_verdict["criterion_title"] == "Annual Family Income"
    assert income_verdict["your_value"] == "₹120,000"
    assert "Maximum ₹200,000 per year" in income_verdict["required_condition"]

    # Check Ineligible Sukanya Samriddhi explanation
    sukanya = next(
        s for s in data["ineligible_schemes"] if s["scheme_slug"] == "sukanya-samriddhi"
    )
    assert sukanya["is_eligible"] is False
    assert len(sukanya["failed_criteria"]) == 2
    gender_fail = next(
        c for c in sukanya["failed_criteria"] if c["field"] == "gender"
    )
    assert "exclusively for Female applicants" in gender_fail["reason"]
    age_fail = next(
        c for c in sukanya["failed_criteria"] if c["field"] == "age"
    )
    assert "exceeds the maximum eligible age" in age_fail["reason"]


def test_authenticated_me_explained_and_single_scheme(client: TestClient):
    setup_explanation_schemes(client)

    # 1. Register & Login as 65yo Senior Citizen
    client.post(
        "/auth/register",
        json={
            "email": "senior.murugan@test.com",
            "phone": "+919876500000",
            "password": "Password123!",
        },
    )
    res_login = client.post(
        "/auth/login",
        json={
            "email": "senior.murugan@test.com",
            "password": "Password123!",
        },
    )
    token = res_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Profile
    client.post(
        "/users/me/profile",
        json={
            "full_name": "Murugan Swamy",
            "date_of_birth": "1959-01-01",
            "gender": "male",
            "state": "Tamil Nadu",
            "district": "Madurai",
            "annual_income": 40000,
            "occupation": "retired",
        },
        headers=headers,
    )

    # 3. GET /eligibility/me/explained
    res_explained = client.get("/eligibility/me/explained", headers=headers)
    assert res_explained.status_code == 200
    report = res_explained.json()
    assert report["eligible_count"] == 1
    assert report["eligible_schemes"][0]["scheme_slug"] == "old-age-pension"

    pension_exp = report["eligible_schemes"][0]
    assert pension_exp["criteria_passed"] == 2
    assert pension_exp["is_eligible"] is True

    # 4. Explain single scheme endpoint: GET /eligibility/schemes/{id}/explain
    schemes_res = client.get("/schemes")
    pm_kisan_id = next(
        s["id"] for s in schemes_res.json()["items"] if s["slug"] == "pm-kisan"
    )

    res_single = client.get(
        f"/eligibility/schemes/{pm_kisan_id}/explain", headers=headers
    )
    assert res_single.status_code == 200
    single_exp = res_single.json()
    assert single_exp["scheme_slug"] == "pm-kisan"
    assert single_exp["is_eligible"] is False
    assert single_exp["status"] == "nearly_eligible"  # 1 out of 2 passed (income passed, occupation failed)
    assert single_exp["criteria_passed"] == 1
    assert single_exp["criteria_total"] == 2
    assert "Nearly eligible" in single_exp["summary_reason"]
