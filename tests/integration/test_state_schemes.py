import pytest
from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.seeds.seed_national_schemes import seed_national_schemes


@pytest.fixture(autouse=True)
def ensure_schemes_seeded():
    db = SessionLocal()
    try:
        seed_national_schemes(db)
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


def test_mp_state_farmer_receives_both_national_and_state_benefits(client: TestClient):
    """
    Ramesh from Madhya Pradesh:
    - 35 years old, Male, Farmer, Income ₹1,20,000, State: Madhya Pradesh.
    - Expected 100% Matches:
      1. PM-Kisan (National: ₹6,000)
      2. Mukhya Mantri Kisan Kalyan Yojana (MP State: ₹6,000 top-up)
      3. Ayushman Bharat PM-JAY (National: ₹5 Lakh cover)
      4. PMAY-Gramin (National)
    """
    payload = {
        "age": 35,
        "gender": "male",
        "state": "Madhya Pradesh",
        "district": "Bhopal",
        "annual_income": 120000,
        "occupation": "farmer",
    }

    response = client.post("/eligibility/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    eligible_slugs = [s["scheme_slug"] for s in data["eligible_schemes"]]
    assert "pm-kisan" in eligible_slugs
    assert "mp-kisan-kalyan-yojana" in eligible_slugs
    assert "ayushman-bharat-pmjay" in eligible_slugs

    # Verify that Maharashtra and Karnataka state farmer/resident schemes are NOT in eligible
    assert "mh-namo-shetkari-yojana" not in eligible_slugs
    assert "ka-gruha-lakshmi-scheme" not in eligible_slugs
    assert "ka-yuva-nidhi-scheme" not in eligible_slugs


def test_mp_state_woman_matches_ladli_behna(client: TestClient):
    """
    Sunita from Madhya Pradesh:
    - 28 years old, Female, Income ₹1,20,000, State: Madhya Pradesh.
    - Expected 100% Matches includes MP Ladli Behna (₹1,250/mo).
    """
    payload = {
        "age": 28,
        "gender": "female",
        "state": "Madhya Pradesh",
        "district": "Indore",
        "annual_income": 120000,
        "occupation": "unemployed",
    }

    response = client.post("/eligibility/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    eligible_slugs = [s["scheme_slug"] for s in data["eligible_schemes"]]
    assert "mp-ladli-behna-yojana" in eligible_slugs

    # Check that explanation mentions state residency
    ladli_behna = next(s for s in data["eligible_schemes"] if s["scheme_slug"] == "mp-ladli-behna-yojana")
    assert any(c["field"] == "state" and c["status"] == "passed" for c in ladli_behna["passed_criteria"])


def test_maharashtra_state_resident_matches_majhi_ladki_bahin(client: TestClient):
    """
    Anjali from Maharashtra:
    - 30 years old, Female, Income ₹1,50,000, State: Maharashtra.
    - Expected Match: Mukhyamantri Majhi Ladki Bahin Yojana.
    """
    payload = {
        "age": 30,
        "gender": "female",
        "state": "Maharashtra",
        "district": "Pune",
        "annual_income": 150000,
        "occupation": "other",
    }

    response = client.post("/eligibility/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    eligible_slugs = [s["scheme_slug"] for s in data["eligible_schemes"]]
    assert "mh-majhi-ladki-bahin" in eligible_slugs
    assert "mp-ladli-behna-yojana" not in eligible_slugs  # MP scheme excluded


def test_karnataka_unemployed_graduate_matches_yuva_nidhi(client: TestClient):
    """
    Karthik from Karnataka:
    - 23 years old, Male, Unemployed, State: Karnataka.
    - Expected Match: Yuva Nidhi Scheme (₹3,000/mo).
    """
    payload = {
        "age": 23,
        "gender": "male",
        "state": "Karnataka",
        "district": "Bengaluru",
        "annual_income": 80000,
        "occupation": "unemployed",
    }

    response = client.post("/eligibility/explain", json=payload)
    assert response.status_code == 200
    data = response.json()

    eligible_slugs = [s["scheme_slug"] for s in data["eligible_schemes"]]
    assert "ka-yuva-nidhi-scheme" in eligible_slugs
    assert "mp-ladli-behna-yojana" not in eligible_slugs


def test_state_filter_on_schemes_api(client: TestClient):
    """
    Verify state filtering parameter on /schemes and /schemes/search.
    """
    # Filtering by Madhya Pradesh should return National schemes + MP schemes
    res_mp = client.get("/schemes?state=Madhya+Pradesh&limit=100")
    assert res_mp.status_code == 200
    mp_items = res_mp.json()["items"]
    mp_states = {item["state"] for item in mp_items}
    assert "Madhya Pradesh" in mp_states
    assert "Maharashtra" not in mp_states
    assert "Karnataka" not in mp_states

    # Searching specifically for MP farmer schemes
    res_search = client.get("/schemes/search?q=kisan&state=Madhya+Pradesh")
    assert res_search.status_code == 200
    slugs = [item["slug"] for item in res_search.json()["items"]]
    assert "pm-kisan" in slugs
    assert "mp-kisan-kalyan-yojana" in slugs
