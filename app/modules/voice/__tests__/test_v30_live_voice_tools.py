from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Benefit, EligibilityRule, RequiredDocument, Scheme
from app.modules.voice.live_gateway import build_grounding_context
from app.modules.voice.tools import VOICE_AGENT_TOOLS, execute_voice_tool


@pytest.fixture
def seed_voice_scheme_and_user(db_session: Session):
    # Scheme
    s = Scheme(
        name="Mukhyamantri Ladli Behna Yojana",
        slug="ladli-behna",
        state="Madhya Pradesh",
        category="Women & Child",
        ministry="Women and Child Development Department MP",
        description="Monthly financial support for women in MP",
        application_url="https://ladlibehna.mp.gov.in",
    )
    db_session.add(s)
    db_session.flush()

    db_session.add(EligibilityRule(scheme_id=s.id, field_name="gender", operator="eq", rule_value="female"))
    db_session.add(EligibilityRule(scheme_id=s.id, field_name="age", operator="gte", rule_value="21"))
    db_session.add(EligibilityRule(scheme_id=s.id, field_name="age", operator="lte", rule_value="60"))
    db_session.add(Benefit(scheme_id=s.id, title="₹1,250 Monthly DBT", description="Monthly cash support"))
    db_session.add(RequiredDocument(scheme_id=s.id, document_name="Aadhaar Card", is_mandatory=True))
    db_session.add(RequiredDocument(scheme_id=s.id, document_name="Samagra Family ID", is_mandatory=True))

    # Citizen User
    u = User(
        email="voice.citizen@gov.in",
        phone="9876543299",
        role="citizen",
        is_verified=True,
        hashed_password=hash_password("VoicePass123!"),
    )
    db_session.add(u)
    db_session.flush()

    p = Profile(
        user_id=u.id,
        full_name="Radha Bai",
        date_of_birth=date(1994, 6, 20),
        gender="female",
        state="Madhya Pradesh",
        district="Sehore",
        annual_income=90000,
        occupation="artisan",
        caste_category="OBC",
    )
    db_session.add(p)
    db_session.commit()
    bitmask_engine.warm_up(db_session)
    return s, u


def test_get_voice_tools_endpoint(client: TestClient):
    res = client.get("/voice/tools")
    assert res.status_code == 200
    data = res.json()
    assert "tools" in data
    tool_names = [t["name"] for t in data["tools"]]
    assert "get_scheme_documents" in tool_names
    assert "search_eligible_schemes" in tool_names
    assert "record_spoken_fact" in tool_names


def test_execute_voice_tool_documents_and_bitmask(db_session: Session, seed_voice_scheme_and_user):
    s, u = seed_voice_scheme_and_user

    # 1. Test get_scheme_documents (Ground Truth Lookup)
    doc_res = execute_voice_tool(
        tool_name="get_scheme_documents",
        args={"scheme_name": "ladli behna"},
        db=db_session,
        user_id=u.id,
    )
    assert doc_res["status"] == "success"
    assert doc_res["scheme_name"] == s.name
    assert "Aadhaar Card" in doc_res["mandatory_documents"]
    assert "Samagra Family ID" in doc_res["mandatory_documents"]
    assert doc_res["verification_status"] == "OFFICIAL_GOVERNMENT_RECORD"

    # 2. Test search_eligible_schemes (Sub-millisecond Bitmask)
    search_res = execute_voice_tool(
        tool_name="search_eligible_schemes",
        args={"state": "Madhya Pradesh", "gender": "female", "age": 30, "occupation": "artisan"},
        db=db_session,
        user_id=u.id,
    )
    assert search_res["status"] == "success"
    assert search_res["total_matches"] >= 1
    assert any(m["slug"] == "ladli-behna" for m in search_res["matched_schemes"])

    # 3. Test record_spoken_fact (Provenance Logging)
    fact_res = execute_voice_tool(
        tool_name="record_spoken_fact",
        args={"fact_key": "annual_income", "fact_value": "75000"},
        db=db_session,
        user_id=u.id,
    )
    assert fact_res["status"] == "success"
    assert fact_res["provenance"] == "VOICE_SELF_REPORTED"
    assert fact_res["verification"] == "PENDING_DOCUMENT_PROOF"


def test_build_grounding_context(db_session: Session, seed_voice_scheme_and_user):
    s, u = seed_voice_scheme_and_user
    context = build_grounding_context(u, db_session)

    assert "Radha Bai" in context
    assert "Madhya Pradesh" in context
    assert "₹90,000" in context
    assert "RULES FOR REAL-TIME VOICE CONVERSATION" in context
    assert "get_scheme_documents" in context


def test_live_voice_websocket_gateway_interaction(client: TestClient, seed_voice_scheme_and_user):
    with client.websocket_connect("/voice/live") as ws:
        # 1. Receive Session Handshake
        handshake = ws.receive_json()
        assert handshake["type"] == "session_ready"
        assert "get_scheme_documents" in handshake["available_tools"]

        # 2. Emit Live Tool Call Request
        ws.send_json({
            "type": "tool_call",
            "call_id": "call_voice_101",
            "name": "get_scheme_documents",
            "args": {"scheme_name": "ladli behna"},
        })

        # 3. Receive Tool Response
        tool_resp = ws.receive_json()
        assert tool_resp["type"] == "tool_response"
        assert tool_resp["call_id"] == "call_voice_101"
        assert tool_resp["name"] == "get_scheme_documents"
        assert "Aadhaar Card" in tool_resp["output"]["mandatory_documents"]

        # 4. Emit Audio Ping / Frame
        ws.send_json({"type": "audio_frame", "data": "dummy_pcm_bytes"})
        ack = ws.receive_json()
        assert ack["type"] == "audio_ack"
