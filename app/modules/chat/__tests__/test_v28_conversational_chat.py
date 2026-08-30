from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.auth.models import CitizenFact, Profile, User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Benefit, EligibilityRule, Scheme


@pytest.fixture
def chat_user_and_token(client: TestClient, db_session: Session):
    user = User(
        email="chat.citizen@gov.in",
        phone="9876543211",
        role="citizen",
        is_verified=True,
        hashed_password=hash_password("ChatPass123!"),
    )
    db_session.add(user)
    db_session.flush()

    profile = Profile(
        user_id=user.id,
        full_name="Anjali Sharma",
        date_of_birth=date(2001, 3, 15),
        state="Madhya Pradesh",
        district="Bhopal",
        gender="female",
        annual_income=150000,
        occupation="student",
        caste_category="General",
    )
    db_session.add(profile)

    # Injected fact
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
        json={"email": "chat.citizen@gov.in", "password": "ChatPass123!"},
    )
    token = login_res.json()["access_token"]
    return user, token


@pytest.fixture
def seed_chat_schemes(db_session: Session):
    s = Scheme(
        name="Mukhyamantri Medhavi Vidyarthi Yojana",
        slug="mp-medhavi-vidyarthi-yojana",
        state="Madhya Pradesh",
        category="Education",
        ministry="Higher Education Department MP",
        description="Scholarship for meritorious students in Madhya Pradesh",
    )
    db_session.add(s)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s.id, field_name="occupation", operator="eq", rule_value="student"))
    db_session.add(Benefit(scheme_id=s.id, title="100% Tuition Fee Waiver", description="Fee waiver"))
    db_session.commit()
    bitmask_engine.warm_up(db_session)


def test_conversational_chat_lifecycle_and_streaming(
    client: TestClient, chat_user_and_token, seed_chat_schemes
):
    user, token = chat_user_and_token
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Session
    create_res = client.post(
        "/chat/sessions",
        json={"title": "College Scholarship Help", "language_code": "hi"},
        headers=headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # 2. Send Message (with injected profile facts context)
    msg_res = client.post(
        f"/chat/sessions/{session_id}/messages",
        json={"content": "mujhe college fees ke liye scholarship chahiye", "language_code": "hi"},
        headers=headers,
    )
    assert msg_res.status_code == 200
    msg_data = msg_res.json()
    assert msg_data["sender"] == "assistant"
    assert len(msg_data["content"]) > 10
    assert len(msg_data["citations"]) >= 1

    # 3. Stream Response (SSE)
    stream_res = client.post(
        f"/chat/sessions/{session_id}/messages/stream",
        json={"content": "aur form kaise bharna hai"},
        headers=headers,
    )
    assert stream_res.status_code == 200
    assert "text/event-stream" in stream_res.headers["content-type"]
    stream_text = stream_res.text
    assert "data:" in stream_text

    # 4. Get Session History
    history_res = client.get(f"/chat/sessions/{session_id}", headers=headers)
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert len(history_data["messages"]) >= 3
