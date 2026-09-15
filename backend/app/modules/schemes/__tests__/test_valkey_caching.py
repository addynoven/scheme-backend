import json
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.cache import cache_set
from app.modules.schemes.service import (
    key_list,
    key_scheme_id,
    key_scheme_slug,
    key_categories,
)
from app.modules.admin.__tests__.test_admin_api import create_admin_user


def test_cache_key_generation():
    assert key_scheme_id(42) == "scheme:id:42"
    assert key_scheme_slug("pm-kisan") == "scheme:slug:pm-kisan"
    assert key_categories() == "scheme:categories"
    
    k1 = key_list(skip=0, limit=20, category="Agriculture", state="Maharashtra")
    k2 = key_list(state="Maharashtra", category="Agriculture", limit=20, skip=0)
    assert k1 == k2
    assert "category=Agriculture" in k1
    assert "state=Maharashtra" in k1


def test_scheme_caching_and_cache_hit_bypass(client: TestClient, db_session: Session):
    admin_creds = create_admin_user(db_session)
    res_login = client.post("/auth/login", json=admin_creds)
    admin_token = res_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "name": "Cache Test Scheme",
        "slug": "cache-test-scheme",
        "ministry": "Ministry of Electronics and IT",
        "description": "A scheme to test Redis caching",
        "status": "active",
        "application_url": "https://example.gov.in",
        "official_website": "https://example.gov.in",
        "benefits": [
            {"title": "Cache Benefit", "description": "High performance"}
        ],
        "eligibility_rules": [
            {"field_name": "occupation", "operator": "eq", "rule_value": "developer"}
        ],
        "required_documents": [
            {"document_name": "Identity Card", "is_mandatory": True, "description": "ID"}
        ],
        "official_sources": [
            {"title": "Official Portal", "url": "https://example.gov.in", "source_type": "website"}
        ],
    }

    # 1. Create scheme
    res = client.post("/schemes", json=payload, headers=admin_headers)
    assert res.status_code == 201
    created = res.json()
    scheme_id = created["id"]

    # 2. Populate cache by fetching once
    res_first = client.get(f"/schemes/slug/{created['slug']}")
    assert res_first.status_code == 200

    # 3. Simulate cache hit by injecting a modified description directly into cache
    fake_cached_data = {
        **created,
        "description": "Served directly from cache without DB query!",
    }
    cache_set(key_scheme_slug(created["slug"]), json.dumps(fake_cached_data))

    # 4. Fetch again - must return the cached version without hitting DB!
    res_cached = client.get(f"/schemes/slug/{created['slug']}")
    assert res_cached.status_code == 200
    assert res_cached.json()["description"] == "Served directly from cache without DB query!"

    # 5. Clean up
    client.delete(f"/schemes/{scheme_id}", headers=admin_headers)
