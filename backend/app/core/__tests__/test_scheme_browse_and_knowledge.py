from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.schemes.models import Scheme


def test_browse_schemes_endpoint_with_filters_and_knowledge_inspection(client: TestClient, db_session: Session):
    # 1. Insert test scheme in Gujarat
    gujarat_scheme = Scheme(
        name="Gujarat Agriculture Development Test Scheme",
        slug="gujarat-agriculture-test-scheme",
        state="Gujarat",
        category="Agriculture",
        ministry="Department of Agriculture Gujarat",
        description="Test scheme for farmers in Gujarat",
        status="active",
        publication_state="published",
    )
    db_session.add(gujarat_scheme)
    db_session.commit()

    # 2. Test GET /schemes/browse with Gujarat and Agriculture filter
    res = client.get("/schemes/browse?state=Gujarat&category=Agriculture&include_knowledge_md=true")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 1
    assert data["filters_applied"]["state"] == "Gujarat"
    assert data["filters_applied"]["category"] == "Agriculture"

    matched = next((item for item in data["items"] if item["slug"] == "gujarat-agriculture-test-scheme"), None)
    assert matched is not None
    assert matched["state"] == "Gujarat"
    assert matched["category"] == "Agriculture"
