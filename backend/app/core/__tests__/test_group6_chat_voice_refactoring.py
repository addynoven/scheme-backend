import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.models import Profile, User
from app.modules.chat.agent_orchestrator import _build_user_context
from app.modules.chat.service import (
    create_chat_session,
    delete_chat_session,
    get_chat_session,
    list_chat_sessions,
    update_chat_session_title,
)
from app.modules.voice.service import voice_service


def create_test_citizen(client: TestClient, email: str) -> dict[str, str]:
    client.post(
        "/auth/register",
        json={"email": email, "phone": "+919911223344", "password": "Password123!"},
    )
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": "Password123!"},
    )
    token = res_login.json()["access_token"]
    user_id = res_login.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


def test_llm_context_excludes_raw_email(client: TestClient, db_session: Session):
    citizen = create_test_citizen(client, "pii.secret@example.com")
    user_id = citizen["user_id"]

    # Build context for LLM
    context = _build_user_context(db_session, user_id)
    assert context is not None
    # PII Minimization: Raw email MUST NOT be passed to LLM context
    assert "email" not in context


def test_modular_chat_facade_and_session_crud(client: TestClient, db_session: Session):
    citizen = create_test_citizen(client, "facade.test@example.com")
    user_id = citizen["user_id"]

    # 1. Create Session
    session = create_chat_session(db_session, user_id, "Welfare Consultation")
    assert session.id is not None
    assert session.user_id == user_id

    # 2. Get Session
    fetched = get_chat_session(db_session, session.id, user_id)
    assert fetched.id == session.id

    # 3. List Sessions
    sessions_list = list_chat_sessions(db_session, user_id)
    assert len(sessions_list) >= 1

    # 4. Update Title
    updated = update_chat_session_title(db_session, session.id, "Renamed Session", user_id)
    assert updated.title == "Renamed Session"

    # 5. Delete Session
    delete_chat_session(db_session, session.id, user_id)
    assert len(list_chat_sessions(db_session, user_id)) == 0


def test_voice_chat_with_authenticated_context(client: TestClient, db_session: Session):
    citizen = create_test_citizen(client, "voice.auth@example.com")
    user_id = citizen["user_id"]

    fake_audio = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00"

    res = voice_service.execute_voice_chat(
        db=db_session,
        user_id=user_id,
        audio_bytes=fake_audio,
        filename="test.wav",
        mime_type="audio/wav",
    )
    assert res.session_id is not None
    assert res.response_text is not None
