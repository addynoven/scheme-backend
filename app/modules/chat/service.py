from datetime import date
import json
import time
from typing import AsyncGenerator
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import EntityNotFoundError
from app.modules.auth.models import CitizenFact, User
from app.modules.chat.models import ChatMessage, ChatSession
from app.modules.chat.schemas import ChatSessionCreate
from app.modules.routing.service import query_router


def create_chat_session(db: Session, user_id: int | None, data: ChatSessionCreate) -> ChatSession:
    session = ChatSession(
        user_id=user_id,
        title=data.title or "New Welfare Conversation",
        language_code=data.language_code or "en",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_chat_sessions(db: Session, user_id: int) -> list[ChatSession]:
    return list(
        db.scalars(
            select(ChatSession)
            .where(ChatSession.user_id == user_id)
            .order_by(ChatSession.updated_at.desc())
        ).all()
    )


def get_chat_session(db: Session, session_id: int, user_id: int | None) -> ChatSession:
    stmt = (
        select(ChatSession)
        .where(ChatSession.id == session_id)
        .options(selectinload(ChatSession.messages))
    )
    session = db.scalar(stmt)
    if not session:
        raise EntityNotFoundError("ChatSession", session_id)

    if session.user_id is not None and user_id is not None and session.user_id != user_id:
        raise EntityNotFoundError("ChatSession", session_id)

    return session


def update_chat_session_title(db: Session, session_id: int, user_id: int | None, title: str) -> ChatSession:
    session = get_chat_session(db, session_id, user_id)
    session.title = title.strip()
    db.commit()
    db.refresh(session)
    return session


def delete_chat_session(db: Session, session_id: int, user_id: int | None) -> None:
    session = get_chat_session(db, session_id, user_id)
    db.delete(session)
    db.commit()


def _build_user_context(db: Session, user_id: int | None) -> dict:
    if not user_id:
        return {}

    user = db.scalar(
        select(User)
        .where(User.id == user_id)
        .options(selectinload(User.profile), selectinload(User.facts))
    )
    if not user:
        return {}

    profile = {}
    if user.profile:
        today = date.today()
        dob = user.profile.date_of_birth
        computed_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else 25

        profile = {
            "state": user.profile.state,
            "age": computed_age,
            "annual_income": user.profile.annual_income,
            "gender": user.profile.gender,
            "occupation": user.profile.occupation,
            "caste_category": user.profile.caste_category,
        }

    # Override with verified facts if available
    for f in user.facts:
        if f.fact_key == "annual_income":
            try: profile["annual_income"] = float(f.fact_value)
            except ValueError: pass
        elif f.fact_key == "age":
            try: profile["age"] = int(f.fact_value)
            except ValueError: pass
        elif f.fact_key in ["state", "gender", "occupation", "caste_category"]:
            profile[f.fact_key] = f.fact_value

    return profile


def send_chat_message(
    db: Session, session_id: int, user_id: int | None, content: str, language_code: str | None = "en"
) -> ChatMessage:
    session = get_chat_session(db, session_id, user_id)

    # 1. Save Citizen User Message
    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        content=content,
        intent="CITIZEN_QUERY",
        citations=[],
    )
    db.add(user_msg)
    db.commit()

    # 2. Build Contextual History and Injected Profile Facts
    history = [{"sender": m.sender, "content": m.content} for m in session.messages[-6:]]
    user_profile = _build_user_context(db, user_id)

    # 3. Route & Synthesize Answer
    routing_result = query_router.route_and_execute(
        raw_query=content,
        db=db,
        user_profile=user_profile,
        chat_history=history,
    )

    # 4. Save Assistant Response Message
    assistant_msg = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=routing_result.response_text,
        intent=str(routing_result.route_used.value),
        citations=routing_result.citations,
    )
    db.add(assistant_msg)

    # Update session title if first turn
    if session.title == "New Welfare Conversation" or not session.title:
        session.title = content[:40] + ("..." if len(content) > 40 else "")

    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg


async def stream_chat_response(
    db: Session, session_id: int, user_id: int | None, content: str
) -> AsyncGenerator[str, None]:
    """Server-Sent Events (SSE) generator for real-time token streaming."""
    assistant_msg = send_chat_message(db, session_id, user_id, content)

    # Yield in natural token chunks for streaming effect
    words = assistant_msg.content.split(" ")
    for i, word in enumerate(words):
        chunk = {
            "type": "token",
            "token": word + (" " if i < len(words) - 1 else ""),
            "citations": assistant_msg.citations if i == len(words) - 1 else [],
        }
        yield f"data: {json.dumps(chunk)}\n\n"

    yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id})}\n\n"
