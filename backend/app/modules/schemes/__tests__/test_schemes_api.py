from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.admin.__tests__.test_admin_api import create_admin_user


def test_create_and_get_scheme_with_nested_relations(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "name": "Pradhan Mantri Kisan Samman Nidhi",
        "slug": "pm-kisan",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "description": "Income support scheme for farmers",
        "status": "active",
        "application_url": "https://pmkisan.gov.in",
        "official_website": "https://pmkisan.gov.in",
        "benefits": [
            {
                "title": "Annual Financial Assistance",
                "description": "Rs 6000 per year in 3 installments",
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
        "required_documents": [
            {
                "document_name": "Aadhaar Card",
                "description": "Identity proof",
                "is_mandatory": True,
            }
        ],
        "official_sources": [
            {
                "title": "PM Kisan Portal",
                "url": "https://pmkisan.gov.in",
                "source_type": "website",
            }
        ],
    }

    # 1. Create Scheme
    res = client.post("/schemes", json=payload, headers=admin_headers)
    assert res.status_code == 201
    data = res.json()
    scheme_id = data["id"]
    assert data["slug"] == "pm-kisan"
    assert len(data["benefits"]) == 1
    assert len(data["eligibility_rules"]) == 2
    assert len(data["required_documents"]) == 1
    assert len(data["official_sources"]) == 1

    # 2. Duplicate slug should return 400
    res_dup = client.post("/schemes", json=payload, headers=admin_headers)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Get by ID
    res_get = client.get(f"/schemes/{scheme_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Pradhan Mantri Kisan Samman Nidhi"

    # 4. Get by Slug
    res_slug = client.get("/schemes/slug/pm-kisan")
    assert res_slug.status_code == 200
    assert res_slug.json()["id"] == scheme_id

    # 5. List schemes with pagination envelope
    res_list = client.get("/schemes?search=Kisan&skip=0&limit=10")
    assert res_list.status_code == 200
    page_data = res_list.json()
    assert page_data["total"] == 1
    assert page_data["skip"] == 0
    assert page_data["limit"] == 10
    assert len(page_data["items"]) == 1

    # 6. Patch Scheme
    res_patch = client.patch(
        f"/schemes/{scheme_id}",
        json={"description": "Updated income support description"},
        headers=admin_headers,
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["description"] == "Updated income support description"

    # 7. Delete Scheme with Cascade
    res_delete = client.delete(f"/schemes/{scheme_id}", headers=admin_headers)
    assert res_delete.status_code == 204

    # 8. Confirm deleted
    res_get_after = client.get(f"/schemes/{scheme_id}")
    assert res_get_after.status_code == 404
