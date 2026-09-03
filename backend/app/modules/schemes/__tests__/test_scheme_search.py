from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user


def seed_searchable_schemes(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    schemes = [
        {
            "name": "Pradhan Mantri Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "category": "Agriculture",
            "tags": "farmer, agriculture, crop, fertilizer, income support, rural",
            "ministry": "Ministry of Agriculture and Farmers Welfare",
            "description": "Direct income support of Rs 6000 per year to small and marginal farmers.",
            "status": "active",
            "benefits": [
                {
                    "title": "Direct Cash Transfer",
                    "description": "Rs 2000 every four months directly to bank account",
                }
            ],
            "eligibility_rules": [
                {
                    "field_name": "occupation",
                    "operator": "eq",
                    "rule_value": "farmer",
                }
            ],
        },
        {
            "name": "Ayushman Bharat PM-JAY",
            "slug": "ayushman-bharat",
            "category": "Healthcare",
            "tags": "health, hospital, medical, insurance, surgery, treatment, bpl",
            "ministry": "Ministry of Health and Family Welfare",
            "description": "Health cover of Rs 5 Lakh per family per year for secondary and tertiary care hospitalization.",
            "status": "active",
            "benefits": [
                {
                    "title": "Cashless Hospitalization",
                    "description": "Up to Rs 5 Lakh coverage per family across empaneled hospitals",
                }
            ],
            "eligibility_rules": [
                {
                    "field_name": "annual_income",
                    "operator": "lte",
                    "rule_value": "150000",
                }
            ],
        },
        {
            "name": "Indira Gandhi National Old Age Pension Scheme",
            "slug": "ignoaps-old-age-pension",
            "category": "Social Welfare",
            "tags": "pension, elderly, senior citizen, monthly allowance, retirement",
            "ministry": "Ministry of Rural Development",
            "description": "Monthly pension for senior citizens living below poverty line.",
            "status": "active",
            "benefits": [
                {
                    "title": "Monthly Pension",
                    "description": "Rs 1000 to Rs 2000 monthly pension credited directly",
                }
            ],
            "eligibility_rules": [
                {
                    "field_name": "age",
                    "operator": "gte",
                    "rule_value": "60",
                }
            ],
        },
    ]

    for s in schemes:
        client.post("/schemes", json=s, headers=admin_headers)


def test_problem_and_tag_search(client: TestClient, db_session: Session):
    seed_searchable_schemes(client, db_session)

    # 1. Search by problem/tag not in scheme title (e.g. 'fertilizer')
    res_fertilizer = client.get("/schemes/search?q=fertilizer")
    assert res_fertilizer.status_code == 200
    data = res_fertilizer.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "pm-kisan"

    # 2. Search by need 'hospital'
    res_hospital = client.get("/schemes/search?q=hospital")
    assert res_hospital.status_code == 200
    data_hosp = res_hospital.json()
    assert data_hosp["total"] == 1
    assert data_hosp["items"][0]["slug"] == "ayushman-bharat"

    # 3. Search by life-stage 'pension'
    res_pension = client.get("/schemes/search?q=pension")
    assert res_pension.status_code == 200
    data_pen = res_pension.json()
    assert data_pen["total"] == 1
    assert data_pen["items"][0]["slug"] == "ignoaps-old-age-pension"


def test_category_filter_and_categories_list(client: TestClient, db_session: Session):
    seed_searchable_schemes(client, db_session)

    # 1. Filter by category 'Healthcare'
    res_cat = client.get("/schemes/search?category=Healthcare")
    assert res_cat.status_code == 200
    data = res_cat.json()
    assert data["total"] == 1
    assert data["items"][0]["category"] == "Healthcare"

    # 2. List all available categories
    res_categories = client.get("/schemes/categories")
    assert res_categories.status_code == 200
    cat_data = res_categories.json()
    assert "categories" in cat_data
    categories_list = cat_data["categories"]
    assert len(categories_list) == 3

    cat_names = [c["category"] for c in categories_list]
    assert "Agriculture" in cat_names
    assert "Healthcare" in cat_names
    assert "Social Welfare" in cat_names

    for c in categories_list:
        assert c["count"] >= 1
