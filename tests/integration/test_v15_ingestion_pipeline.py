import json
from unittest.mock import MagicMock
import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.main import app
from app.models.eligibility_rule import EligibilityRule
from app.models.ingestion_source import IngestionSource
from app.models.ingestion_triage import IngestionTriageItem
from app.models.scheme import Scheme
from app.models.user import User
from app.services.ingestion.ingestion_service import (
    get_or_create_default_sources,
    run_ingestion_pipeline,
)


@pytest.fixture
def admin_token(db_session: Session) -> str:
    admin = db_session.scalar(select(User).where(User.email == "v15_admin@gov.in"))
    if not admin:
        admin = User(
            email="v15_admin@gov.in",
            phone="9876543299",
            hashed_password=hash_password("AdminPass123!"),
            role="admin",
        )
        db_session.add(admin)
        db_session.commit()

    from app.core.security import create_access_token
    return create_access_token(subject=str(admin.id))


def test_gate1_zero_bandwidth_http_304(db_session: Session):
    """Verifies RFC 7232 HTTP 304 returns 0 bytes downloaded and exits instantly."""
    sources = get_or_create_default_sources(db_session)
    source = sources[0]
    source.etag = '"etag-12345"'
    source.last_modified_header = "Wed, 21 Oct 2025 07:28:00 GMT"
    db_session.commit()

    # Mock HTTP client returning 304
    mock_client = MagicMock(spec=httpx.Client)
    mock_response = httpx.Response(status_code=304, headers={"ETag": '"etag-12345"'})
    mock_client.get.return_value = mock_response

    results = run_ingestion_pipeline(db=db_session, source_key=source.source_key, client=mock_client)

    assert len(results) == 1
    res = results[0]
    assert res.status == "unchanged_304"
    assert res.http_status == 304
    assert res.bytes_downloaded == 0
    assert res.schemes_created == 0


def test_gate2_circuit_breaker_quarantine(db_session: Session):
    """Verifies that an HTML login wall / error page trips Gate 2 and quarantines bad payload."""
    sources = get_or_create_default_sources(db_session)
    source = sources[1]

    # Mock HTTP client returning HTML error page under HTTP 200
    html_content = b"<!DOCTYPE html><html><head><title>Cloudflare 502</title></head><body>Bad Gateway</body></html>"
    mock_client = MagicMock(spec=httpx.Client)
    mock_response = httpx.Response(status_code=200, content=html_content)
    mock_client.get.return_value = mock_response

    results = run_ingestion_pipeline(db=db_session, source_key=source.source_key, client=mock_client)

    assert len(results) == 1
    res = results[0]
    assert res.status == "circuit_broken"
    assert "Gate 2 tripped" in res.message

    db_session.refresh(source)
    assert source.failure_count >= 1
    assert source.status == "degraded"


def test_full_pipeline_ingest_hash_diff_and_triage(db_session: Session, admin_token: str, client: TestClient):
    """
    Tests complete lifecycle:
    1. Ingest new scheme -> Auto-created in DB.
    2. Ingest identical payload -> Gate 3 Semantic Hash match (0 DB writes).
    3. Ingest breaking change (tightened income rule) -> Staged in Triage Queue.
    4. Admin 1-Click Approves -> Rule applied to live DB.
    """
    sources = get_or_create_default_sources(db_session)
    source = sources[2]
    source.content_hash = None
    source.etag = None
    db_session.commit()

    initial_payload = {
        "schemes": [
            {
                "name": "PM Krishi Solar Pump Scheme",
                "slug": "pm-krishi-solar-pump",
                "state": "ALL_INDIA",
                "category": "Agriculture",
                "ministry": "Ministry of New and Renewable Energy",
                "description": "Subsidized solar water pumps for small farmers.",
                "status": "Active",
                "eligibility_rules": [
                    {
                        "field_name": "income",
                        "operator": "<=",
                        "rule_value": "500000",
                        "is_mandatory": True,
                    }
                ],
                "benefits": [
                    {
                        "title": "Solar Pump Subsidy",
                        "description": "60% subsidy on solar pump installation",
                    }
                ],
                "required_documents": [
                    {
                        "document_name": "Land Records",
                        "is_mandatory": True,
                        "description": "Khasra / Khatauni",
                    }
                ],
            }
        ]
    }

    # --- STEP 1: Ingest New Scheme ---
    mock_client = MagicMock(spec=httpx.Client)
    mock_response = httpx.Response(
        status_code=200,
        content=json.dumps(initial_payload).encode("utf-8"),
        headers={"ETag": '"pump-v1"'},
    )
    mock_client.get.return_value = mock_response

    results = run_ingestion_pipeline(db=db_session, source_key=source.source_key, client=mock_client)
    assert len(results) == 1
    assert results[0].status == "synced_auto_approved"
    assert results[0].schemes_created == 1

    scheme = db_session.scalar(select(Scheme).where(Scheme.slug == "pm-krishi-solar-pump"))
    assert scheme is not None
    assert scheme.eligibility_rules[0].rule_value == "500000"

    # --- STEP 2: Ingest Identical Payload (Gate 3 Hash Match) ---
    results_repeat = run_ingestion_pipeline(db=db_session, source_key=source.source_key, client=mock_client)
    assert results_repeat[0].status == "hash_matched_0_diff"
    assert results_repeat[0].schemes_created == 0
    assert results_repeat[0].schemes_updated == 0

    # --- STEP 3: Ingest Breaking Change (Income Cutoff Lowered to 300,000) ---
    breaking_payload = json.loads(json.dumps(initial_payload))
    breaking_payload["schemes"][0]["eligibility_rules"][0]["rule_value"] = "300000"

    mock_client.get.return_value = httpx.Response(
        status_code=200,
        content=json.dumps(breaking_payload).encode("utf-8"),
        headers={"ETag": '"pump-v2"'},
    )

    results_breaking = run_ingestion_pipeline(db=db_session, source_key=source.source_key, client=mock_client)
    assert results_breaking[0].status == "routed_to_triage"
    assert results_breaking[0].breaking_changes_triaged == 1

    # Verify live DB still has 500,000 (not broken!)
    db_session.refresh(scheme)
    assert scheme.eligibility_rules[0].rule_value == "500000"

    # --- STEP 4: Admin Approves Triage Item via API ---
    triage_resp = client.get(
        "/admin/ingestion/triage",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert triage_resp.status_code == 200
    triage_items = triage_resp.json()
    assert len(triage_items) >= 1
    target_item = next(i for i in triage_items if i["scheme_slug"] == "pm-krishi-solar-pump")
    assert target_item["change_type"] == "rule_tightened"

    approve_resp = client.post(
        f"/admin/ingestion/triage/{target_item['id']}/approve",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"

    # Verify live DB now has the approved 300,000!
    db_session.expire_all()
    updated_scheme = db_session.scalar(select(Scheme).where(Scheme.slug == "pm-krishi-solar-pump"))
    assert updated_scheme.eligibility_rules[0].rule_value == "300000"


def test_admin_reject_triage_item(db_session: Session, admin_token: str, client: TestClient):
    """Verifies that rejecting a triage item preserves current scheme rules."""
    sources = get_or_create_default_sources(db_session)
    source = sources[0]

    # Create a scheme and an unapproved triage item
    scheme = Scheme(
        name="Kisan Credit Card Scheme",
        slug="kisan-credit-card",
        state="ALL_INDIA",
        category="Agriculture",
        ministry="Ministry of Agriculture",
        description="Low interest credit for farmers",
        status="Active",
    )
    db_session.add(scheme)
    db_session.flush()

    rule = EligibilityRule(
        scheme_id=scheme.id,
        field_name="land_holding_acres",
        operator="<=",
        rule_value="10",
    )
    db_session.add(rule)
    db_session.flush()

    triage_item = IngestionTriageItem(
        source_id=source.id,
        scheme_slug=scheme.slug,
        scheme_name=scheme.name,
        change_type="rule_tightened",
        impact_level="breaking",
        diff_summary="Land holding limit lowered from 10 to 5 acres",
        diff_payload={
            "before_state": {"rule": {"field_name": "land_holding_acres", "operator": "<=", "rule_value": "10"}},
            "after_state": {"rule": {"field_name": "land_holding_acres", "operator": "<=", "rule_value": "5"}},
        },
        status="pending_review",
    )
    db_session.add(triage_item)
    db_session.commit()

    # Reject via API
    resp = client.post(
        f"/admin/ingestion/triage/{triage_item.id}/reject",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "rejected"

    # Verify live DB is untouched (still 10)
    db_session.expire_all()
    refreshed_scheme = db_session.scalar(select(Scheme).where(Scheme.slug == "kisan-credit-card"))
    assert refreshed_scheme.eligibility_rules[0].rule_value == "10"
