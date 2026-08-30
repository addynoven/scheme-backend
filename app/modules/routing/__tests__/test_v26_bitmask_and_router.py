import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.eligibility.bitmask_engine import BitmaskRuleEngine, bitmask_engine
from app.modules.routing.schemas import RouteType
from app.modules.routing.service import IntelligentQueryRouter, query_router
from app.modules.schemes.models import Benefit, EligibilityRule, RequiredDocument, Scheme


@pytest.fixture
def seed_test_schemes(db_session: Session):
    # 1. Scheme A: MP Ladli Behna (Women, MP, Age 21-60)
    s1 = Scheme(
        name="Mukhyamantri Ladli Behna Yojana",
        slug="ladli-behna",
        state="Madhya Pradesh",
        category="Women & Child",
        ministry="Women and Child Development Department MP",
        description="Monthly financial support for women in Madhya Pradesh",
        application_url="https://ladlibehna.mp.gov.in",
    )
    db_session.add(s1)
    db_session.flush()

    db_session.add(EligibilityRule(scheme_id=s1.id, field_name="gender", operator="eq", rule_value="female"))
    db_session.add(EligibilityRule(scheme_id=s1.id, field_name="age", operator="gte", rule_value="21"))
    db_session.add(EligibilityRule(scheme_id=s1.id, field_name="age", operator="lte", rule_value="60"))
    db_session.add(Benefit(scheme_id=s1.id, title="₹1,250 Monthly DBT", description="Monthly cash support"))
    db_session.add(RequiredDocument(scheme_id=s1.id, document_name="Aadhaar Card", is_mandatory=True))

    # 2. Scheme B: PM Kisan (All India, Farmer, any age)
    s2 = Scheme(
        name="PM Kisan Samman Nidhi",
        slug="pm-kisan",
        state="ALL_INDIA",
        category="Agriculture",
        ministry="Ministry of Agriculture",
        description="Income support for all farmer families across India",
        application_url="https://pmkisan.gov.in",
    )
    db_session.add(s2)
    db_session.flush()

    db_session.add(EligibilityRule(scheme_id=s2.id, field_name="occupation", operator="eq", rule_value="farmer"))
    db_session.add(Benefit(scheme_id=s2.id, title="₹6,000 Annual Direct Cash", description="Direct transfer"))

    db_session.commit()


def test_bitmask_engine_warmup_and_microsecond_evaluation(db_session: Session, seed_test_schemes):
    engine = BitmaskRuleEngine()
    engine.warm_up(db_session)

    assert engine.is_warmed is True
    assert len(engine.scheme_ids) == 2

    # Case 1: Female in MP, age 25, not a farmer
    matches_1 = engine.evaluate({
        "state": "Madhya Pradesh",
        "gender": "female",
        "age": 25,
        "occupation": "unemployed",
    })
    slugs_1 = [m["slug"] for m in matches_1]
    assert "ladli-behna" in slugs_1
    assert "pm-kisan" not in slugs_1

    # Case 2: Male Farmer in MP, age 45
    matches_2 = engine.evaluate({
        "state": "Madhya Pradesh",
        "gender": "male",
        "age": 45,
        "occupation": "farmer",
    })
    slugs_2 = [m["slug"] for m in matches_2]
    assert "pm-kisan" in slugs_2
    assert "ladli-behna" not in slugs_2


def test_query_router_decomposition_and_synthesis(db_session: Session, seed_test_schemes):
    # Warm up global engine
    bitmask_engine.warm_up(db_session)

    # Test Hinglish / Hindi Query
    raw_query = "bhaiya meri umar 25 saal hai MP me rehti hu ladli behna ke baare me bataiye"
    response = query_router.route_and_execute(
        raw_query=raw_query,
        db=db_session,
        user_profile={"gender": "female", "state": "Madhya Pradesh", "age": 25},
    )

    assert response.query == raw_query
    assert response.plan.detected_language in ["hi", "hinglish", "en"]
    assert response.plan.sql_payload.state == "Madhya Pradesh"
    assert len(response.matched_schemes) >= 1
    assert "ladli-behna" in [m["slug"] for m in response.matched_schemes]
    assert len(response.citations) >= 1


def test_routing_endpoint_api(client: TestClient, db_session: Session, seed_test_schemes):
    bitmask_engine.warm_up(db_session)

    payload = {
        "query": "What schemes are available for a farmer in India?",
        "user_profile": {
            "occupation": "farmer",
            "state": "ALL_INDIA",
            "age": 35,
        },
    }

    res = client.post("/routing/query", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["query"] == payload["query"]
    assert len(data["matched_schemes"]) >= 1
    assert any("pm-kisan" in s["slug"] for s in data["matched_schemes"])
    assert "response_text" in data
    assert len(data["citations"]) >= 1
