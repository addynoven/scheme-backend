from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.seeds.seed_national_schemes import NATIONAL_SCHEMES_DATA, seed_national_schemes


def test_national_schemes_seeding_and_idempotency(
    client: TestClient, db_session: Session
):
    # 1. First Run -> Seeds all schemes
    count1 = seed_national_schemes(db_session)
    assert count1 == len(NATIONAL_SCHEMES_DATA)
    assert count1 == 12

    # 2. Second Run -> Idempotent, doesn't duplicate or fail
    count2 = seed_national_schemes(db_session)
    assert count2 == 0

    # 3. Verify via GET /schemes endpoint
    res = client.get("/schemes?limit=50")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 12

    # 4. Verify Categories breakdown endpoint
    res_cats = client.get("/schemes/categories")
    assert res_cats.status_code == 200
    cats = {c["category"]: c["count"] for c in res_cats.json()["categories"]}
    assert "Agriculture" in cats
    assert "Healthcare" in cats
    assert "Women & Child" in cats
    assert "Social Welfare" in cats
    assert "Housing" in cats
    assert "Employment & Skills" in cats
    assert "Education" in cats
    assert "Business & Finance" in cats


def test_real_citizen_scenarios_against_national_dataset(
    client: TestClient, db_session: Session
):
    seed_national_schemes(db_session)

    # Scenario A: Farmer Ramesh (45yo male, farmer, income 1.2 Lakh)
    # Qualifies for: PM Kisan, PM Fasal Bima, Ayushman Bharat, PMAY-Gramin
    res_ramesh = client.post(
        "/eligibility/explain",
        json={
            "age": 45,
            "gender": "male",
            "occupation": "farmer",
            "annual_income": 120000,
        },
    )
    assert res_ramesh.status_code == 200
    ramesh_data = res_ramesh.json()
    ramesh_eligible_slugs = [
        s["scheme_slug"] for s in ramesh_data["eligible_schemes"]
    ]
    assert "pm-kisan" in ramesh_eligible_slugs
    assert "pm-fasal-bima-yojana" in ramesh_eligible_slugs
    assert "ayushman-bharat-pmjay" in ramesh_eligible_slugs
    assert "pmay-gramin" in ramesh_eligible_slugs

    # Scenario B: Rural Artisan Sunita (34yo female, carpenter/artisan, income 90k)
    # Qualifies for: PM Vishwakarma, PM Ujjwala, PMAY-Gramin, Ayushman Bharat, APY
    res_sunita = client.post(
        "/eligibility/explain",
        json={
            "age": 34,
            "gender": "female",
            "occupation": "carpenter",
            "annual_income": 90000,
        },
    )
    assert res_sunita.status_code == 200
    sunita_data = res_sunita.json()
    sunita_eligible_slugs = [
        s["scheme_slug"] for s in sunita_data["eligible_schemes"]
    ]
    assert "pm-vishwakarma" in sunita_eligible_slugs
    assert "pm-ujjwala-yojana" in sunita_eligible_slugs
    assert "pmay-gramin" in sunita_eligible_slugs

    # Scenario C: 7yo Girl Child Priya
    # Qualifies for: Sukanya Samriddhi
    res_priya = client.post(
        "/eligibility/explain",
        json={
            "age": 7,
            "gender": "female",
            "annual_income": 80000,
        },
    )
    assert res_priya.status_code == 200
    priya_data = res_priya.json()
    priya_eligible_slugs = [
        s["scheme_slug"] for s in priya_data["eligible_schemes"]
    ]
    assert "sukanya-samriddhi-yojana" in priya_eligible_slugs
