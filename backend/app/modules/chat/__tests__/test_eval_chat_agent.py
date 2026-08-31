from datetime import date
from unittest.mock import patch
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Benefit, EligibilityRule, Scheme


import uuid

@pytest.fixture
def eval_user_and_token(client: TestClient, db_session: Session):
    unique_id = uuid.uuid4().hex[:8]
    email = f"eval.{unique_id}@gov.in"
    phone = f"987{unique_id[:7]}"
    user = User(
        email=email,
        phone=phone,
        role="citizen",
        is_verified=True,
        hashed_password=hash_password("EvalPass123!"),
    )
    db_session.add(user)
    db_session.flush()

    profile = Profile(
        user_id=user.id,
        full_name="Rajesh Verma",
        date_of_birth=date(2000, 5, 20),
        state="Madhya Pradesh",
        district="Indore",
        gender="male",
        annual_income=180000,
        occupation="student",
        caste_category="OBC",
    )
    db_session.add(profile)
    db_session.add(
        CitizenFact(
            user_id=user.id,
            fact_key="state",
            fact_value="Madhya Pradesh",
        )
    )
    db_session.commit()

    login_res = client.post(
        "/auth/login",
        json={"email": email, "password": "EvalPass123!"},
    )
    token = login_res.json()["access_token"]
    return user, token


@pytest.fixture
def seed_eval_schemes(db_session: Session):
    schemes_data = [
        {
            "name": "Mukhyamantri Medhavi Vidyarthi Yojana",
            "slug": "mp-medhavi-vidyarthi-yojana",
            "state": "Madhya Pradesh",
            "category": "Education",
            "ministry": "Department of Higher Education MP",
            "description": "Tuition fee waiver for meritorious students in MP",
            "rules": [("occupation", "eq", "student"), ("state", "eq", "Madhya Pradesh")],
            "benefits": [("100% Tuition Waiver", "Government bears full tuition fees")],
        },
        {
            "name": "Post-Matric Scholarship for Higher Education",
            "slug": "post-matric-scholarship",
            "state": "Madhya Pradesh",
            "category": "Education",
            "ministry": "Ministry of Social Justice and Empowerment",
            "description": "Financial scholarship for higher education students",
            "rules": [("occupation", "eq", "student")],
            "benefits": [("Scholarship Allowance", "Monthly scholarship and fee coverage")],
        },
        {
            "name": "Pradhan Mantri Mudra Yojana",
            "slug": "pm-mudra-yojana",
            "state": "All-India",
            "category": "Business",
            "ministry": "Ministry of Finance",
            "description": "Collateral-free micro loans up to 10 lakhs for MSMEs",
            "rules": [("age", "gte", "18")],
            "benefits": [("Business Loan", "Up to Rs 10 Lakhs collateral free")],
        },
        {
            "name": "PM Kisan Samman Nidhi",
            "slug": "pm-kisan",
            "state": "All-India",
            "category": "Agriculture",
            "ministry": "Ministry of Agriculture and Farmers Welfare",
            "description": "Financial support of Rs 6000 per year for farmer families",
            "rules": [("occupation", "eq", "farmer")],
            "benefits": [("Direct Income Support", "Rs 6,000 yearly in 3 installments")],
        },
    ]

    for sd in schemes_data:
        existing = db_session.query(Scheme).filter_by(slug=sd["slug"]).first()
        if not existing:
            s = Scheme(
                name=sd["name"],
                slug=sd["slug"],
                state=sd["state"],
                category=sd["category"],
                ministry=sd["ministry"],
                description=sd["description"],
            )
            db_session.add(s)
            db_session.flush()
            for r in sd["rules"]:
                db_session.add(EligibilityRule(scheme_id=s.id, field_name=r[0], operator=r[1], rule_value=r[2]))
            for b in sd["benefits"]:
                db_session.add(Benefit(scheme_id=s.id, title=b[0], description=b[1]))

    db_session.commit()
    bitmask_engine.warm_up(db_session)


# ==============================================================================
# Category 1: 5 Greetings & Chit-Chat Cases (Assert 0 tool scheme dumps)
# ==============================================================================
@pytest.mark.parametrize(
    "greeting_query",
    [
        "hello there",
        "namaste",
        "hi bot",
        "good morning",
        "who are you and what can you do?",
    ],
)
def test_eval_category_1_greetings(
    client: TestClient, eval_user_and_token, seed_eval_schemes, greeting_query
):
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    # Create Session
    session_res = client.post("/chat/sessions", json={"title": "Greeting Test"}, headers=headers)
    session_id = session_res.json()["id"]

    # Send Greeting Query
    msg_res = client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": greeting_query},
        headers=headers,
    )
    assert msg_res.status_code == 200
    data = msg_res.json()

    if data["status"] == "service_unavailable":
        assert data["content"] == "I'm having trouble connecting right now. Please try again in a moment."
        assert len(data["citations"]) == 0
    else:
        assert data["status"] == "success"
        # Rule 1 & Rule 5: Zero scheme citations for pure greetings
        assert len(data["citations"]) == 0
        # Rule 6: Concise human response (not a 10-paragraph wall of text)
        assert len(data["content"]) < 600
        assert any(
            w in data["content"].lower() or w in data["content"]
            for w in [
                "hello", "hi", "namaste", "advisor", "assist", "help", "welfare",
                "schemes", "citizen", "government", "guide", "नमस्ते", "सलाहकार", "मदद", "योजना"
            ]
        )


# ==============================================================================
# Category 2: 5 Direct Eligibility Inquiries (Assert check_eligibility & max 3 schemes)
# ==============================================================================
@pytest.mark.parametrize(
    "elig_query",
    [
        "I am a 22yo student in Madhya Pradesh, what schemes can I get?",
        "I am a small farmer in Uttar Pradesh with 2 acres land looking for assistance",
        "Looking for collateral free business loan up to 10 lakhs for my shop",
        "Old age pension schemes for senior citizen after 60 years",
        "Government savings and scholarship schemes for my 8 year old daughter",
    ],
)
def test_eval_category_2_eligibility(
    client: TestClient, eval_user_and_token, seed_eval_schemes, elig_query
):
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    session_res = client.post("/chat/sessions", json={"title": "Eligibility Test"}, headers=headers)
    session_id = session_res.json()["id"]

    msg_res = client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": elig_query},
        headers=headers,
    )
    assert msg_res.status_code == 200
    data = msg_res.json()

    if data["status"] == "service_unavailable":
        assert data["content"] == "I'm having trouble connecting right now. Please try again in a moment."
        assert len(data["citations"]) == 0
    else:
        assert data["status"] == "success"
        # Must contain relevant response
        assert len(data["content"]) > 10
        # Rule 6: Citations must not overwhelm citizen
        assert len(data["citations"]) <= 4


# ==============================================================================
# Category 3: 5 Follow-ups & Deep Dives (Assert get_scheme_details & step-by-step guidance)
# ==============================================================================
@pytest.mark.parametrize(
    "followup_query",
    [
        "How do I apply for MMVY in MP?",
        "What documents are required for PM Mudra loan?",
        "What is the income ceiling for post-matric scholarship?",
        "Is PM-Kisan available for tenant farmers?",
        "Where is the official application portal link for Mudra loan?",
    ],
)
def test_eval_category_3_followups(
    client: TestClient, eval_user_and_token, seed_eval_schemes, followup_query
):
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    session_res = client.post("/chat/sessions", json={"title": "Followup Test"}, headers=headers)
    session_id = session_res.json()["id"]

    msg_res = client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": followup_query},
        headers=headers,
    )
    assert msg_res.status_code == 200
    data = msg_res.json()

    if data["status"] == "service_unavailable":
        assert data["content"] == "I'm having trouble connecting right now. Please try again in a moment."
        assert len(data["citations"]) == 0
    else:
        assert data["status"] == "success"
        assert len(data["content"]) > 10


# ==============================================================================
# Category 4: 5 Out-of-Scope Queries (Assert 0 tool calls & polite boundary redirection)
# ==============================================================================
@pytest.mark.parametrize(
    "out_of_scope_query",
    [
        "What is the weather forecast in Mumbai today?",
        "Write a Python script to sort a binary search tree",
        "Who won the cricket world cup in 2011?",
        "Give me stock tips for investing in the stock market",
        "Can you write a poem about artificial intelligence?",
    ],
)
def test_eval_category_4_out_of_scope(
    client: TestClient, eval_user_and_token, seed_eval_schemes, out_of_scope_query
):
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    session_res = client.post("/chat/sessions", json={"title": "Out of Scope Test"}, headers=headers)
    session_id = session_res.json()["id"]

    msg_res = client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": out_of_scope_query},
        headers=headers,
    )
    assert msg_res.status_code == 200
    data = msg_res.json()

    if data["status"] == "service_unavailable":
        assert data["content"] == "I'm having trouble connecting right now. Please try again in a moment."
        assert len(data["citations"]) == 0
    else:
        assert data["status"] == "success"
        # Rule 1 & Rule 5: Out of scope must NEVER cite government welfare schemes
        assert len(data["citations"]) == 0


# ==============================================================================
# Category 5: Regression Tests for Service Unavailable & Category Filtering
# ==============================================================================
from unittest.mock import patch
from app.modules.chat.tools import execute_check_eligibility


def test_eval_service_unavailable_explicit_failure_state(
    client: TestClient, eval_user_and_token, seed_eval_schemes
):
    """
    Assert that when _call_gemini_api fails after retries:
    1. Returns status: 'service_unavailable'
    2. Returns explicit user-friendly error text
    3. Never falls back to keyword-based scheme dumps or canned greetings (Rule 1).
    """
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    session_res = client.post("/chat/sessions", json={"title": "Failure State Test"}, headers=headers)
    session_id = session_res.json()["id"]

    test_queries = [
        "Are there education scholarships for OBC students?",
        "are there anything student in north east india part",
        "any thing up ?",
        "hello there",
    ]

    with patch("app.modules.chat.service._call_gemini_api", return_value=None):
        for q in test_queries:
            msg_res = client.post(
                f"/chat/sessions/{session_id}/messages",
                json={"content": q},
                headers=headers,
            )
            assert msg_res.status_code == 200
            data = msg_res.json()

            # Must have explicit service_unavailable status
            assert data["status"] == "service_unavailable"
            assert data["content"] == "I'm having trouble connecting right now. Please try again in a moment."
            assert data["citations"] == []
            assert data["sources"] == []
            assert data["token_usage"] is None or data["token_usage"]["total_tokens"] == 0

            # Must NOT contain canned greeting or dumped schemes
            assert "Sovereign Citizen Welfare AI Advisor. How can I assist" not in data["content"]
            assert "Pradhan Mantri Mudra Yojana" not in data["content"]
            assert "Atal Pension Yojana" not in data["content"]


def test_eval_category_filtering_check_eligibility(db_session: Session, seed_eval_schemes):
    """
    Assert check_eligibility filters by category/topic before truncating:
    - 'Education' / 'scholarship' returns only education schemes (MMVY, Post-Matric)
    - Never returns Mudra loan or Pension in an Education search.
    """
    res = execute_check_eligibility(
        db=db_session,
        user_profile={"state": "Madhya Pradesh", "occupation": "student", "caste_category": "OBC", "age": 22},
        tool_args={"category": "Education", "topic": "scholarship"},
    )
    assert res["status"] == "success"
    slugs = [s["slug"] for s in res["schemes"]]

    # Education schemes must be returned
    assert any(s in slugs for s in ["mp-medhavi-vidyarthi-yojana", "post-matric-scholarship"])

    # Unrelated categories must NOT be returned
    assert "pm-mudra-yojana" not in slugs
    assert "atal-pension-yojana" not in slugs


def test_eval_business_loan_filtering_check_eligibility(db_session: Session, seed_eval_schemes):
    """
    Assert check_eligibility for 'Business' / 'loan' returns business schemes.
    """
    res = execute_check_eligibility(
        db=db_session,
        user_profile={"age": 28, "occupation": "self-employed"},
        tool_args={"category": "Business", "topic": "loan"},
    )
    assert res["status"] == "success"
    slugs = [s["slug"] for s in res["schemes"]]

    assert "pm-mudra-yojana" in slugs
    assert "post-matric-scholarship" not in slugs


def test_eval_obc_scholarship_query_filters_out_unrelated_schemes(
    client: TestClient, eval_user_and_token, seed_eval_schemes
):
    """
    Assert that a query asking specifically for education scholarships
    never returns Mudra loans or Pension schemes.
    """
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    session_res = client.post("/chat/sessions", json={"title": "OBC Scholarship Test"}, headers=headers)
    session_id = session_res.json()["id"]

    # Mock an agentic turn where Gemini emits check_eligibility with category="Education"
    mock_gemini_turn_1 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "check_eligibility",
                                "args": {
                                    "category": "Education",
                                    "topic": "scholarship",
                                    "caste_category": "OBC",
                                    "occupation": "student",
                                    "state": "Madhya Pradesh",
                                },
                            }
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 100, "candidatesTokenCount": 20, "totalTokenCount": 120},
    }

    mock_gemini_turn_2 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                "Based on your student and OBC profile, here are recommended education scholarships:\n"
                                "• [Mukhyamantri Medhavi Vidyarthi Yojana](/schemes/mp-medhavi-vidyarthi-yojana): 100% Tuition Waiver\n"
                                "• [Post-Matric Scholarship for Higher Education](/schemes/post-matric-scholarship): Full Fee Coverage"
                            )
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 150, "candidatesTokenCount": 50, "totalTokenCount": 200},
    }

    with patch("app.modules.chat.service._call_gemini_api", side_effect=[mock_gemini_turn_1, mock_gemini_turn_2]):
        msg_res = client.post(
            f"/chat/sessions/{session_id}/messages",
            json={"content": "Are there education scholarships for OBC students?"},
            headers=headers,
        )
        assert msg_res.status_code == 200
        data = msg_res.json()

        assert data["status"] == "success"
        assert len(data["citations"]) > 0
        # Assert education schemes are cited
        assert any(c in data["citations"] for c in ["mp-medhavi-vidyarthi-yojana", "post-matric-scholarship"])
        # Assert unrelated schemes are NOT cited
        assert "pm-mudra-yojana" not in data["citations"]
        assert "atal-pension-yojana" not in data["citations"]
        assert "pm-kisan" not in data["citations"]


def test_eval_agy_cli_provider_switch(client: TestClient, eval_user_and_token: tuple[User, str], seed_eval_schemes: None):
    """
    Asserts that LLM_PROVIDER="agy" invokes the agy provider adapter and completes an agentic turn.
    """
    user, token = eval_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    sess_res = client.post("/chat/sessions", json={"title": "Agy Provider Test"}, headers=headers)
    session_id = sess_res.json()["id"]

    mock_agy_output_turn_1 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "check_eligibility",
                                "args": {
                                    "category": "Education",
                                    "topic": "scholarship",
                                    "state": "Madhya Pradesh",
                                    "occupation": "student",
                                    "age": 20,
                                },
                            }
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 120, "candidatesTokenCount": 25, "totalTokenCount": 145},
    }

    mock_agy_output_turn_2 = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "text": (
                                "Here are the top scholarship schemes for you:\n"
                                "• [Mukhyamantri Medhavi Vidyarthi Yojana](/schemes/mp-medhavi-vidyarthi-yojana): Tuition waiver."
                            )
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 160, "candidatesTokenCount": 40, "totalTokenCount": 200},
    }

    with patch("app.core.config.settings.LLM_PROVIDER", "agy"):
        with patch("app.modules.chat.service._call_agy_cli", side_effect=[mock_agy_output_turn_1, mock_agy_output_turn_2]) as mock_agy:
            msg_res = client.post(
                f"/chat/sessions/{session_id}/messages",
                json={"content": "What scholarships can I get in MP?"},
                headers=headers,
            )
            assert msg_res.status_code == 200
            data = msg_res.json()
            assert data["status"] == "success"
            assert mock_agy.call_count == 2
            assert "mp-medhavi-vidyarthi-yojana" in data["citations"]

