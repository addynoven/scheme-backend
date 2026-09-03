import re
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.chat.models import ChatSession


def get_chat_session(
    db: Session,
    session_id: int,
    user_id: int,
) -> ChatSession:
    """Retrieve chat session and verify ownership."""
    session = db.scalar(select(ChatSession).where(ChatSession.id == session_id))
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat session {session_id} not found",
        )
    if session.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: you do not own this chat session",
        )
    return session


def create_chat_session(
    db: Session,
    user_id: int,
    payload_or_title: Any = None,
    language_code: str | None = "en",
) -> ChatSession:
    """Create a new chat session for an authenticated citizen."""
    title = "New Welfare Conversation"
    lang = language_code or "en"
    if hasattr(payload_or_title, "title"):
        title = payload_or_title.title or title
        lang = getattr(payload_or_title, "language_code", None) or lang
    elif isinstance(payload_or_title, str):
        title = payload_or_title

    session = ChatSession(
        user_id=user_id,
        title=title,
        language_code=lang,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_chat_sessions(db: Session, user_id: int, limit: int = 50) -> list[ChatSession]:
    """List chat sessions for an authenticated citizen ordered by last update."""
    query = (
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
    )
    sessions = list(db.scalars(query).all())

    generic_names = ("New Welfare Conversation", "New Citizen Consultation", "New Welfare Consultation", "New Consultation")
    updated = False
    for s in sessions:
        if s.title in generic_names or not s.title or s.title.startswith("New "):
            if s.messages:
                first_user_msg = next((m for m in s.messages if m.sender == "user"), None)
                if first_user_msg and first_user_msg.content:
                    clean = re.sub(r'[\r\n\t]+', ' ', first_user_msg.content).strip()
                    stripped = re.sub(r'^(hello|hi|namaste|hey|who are you|tell me about|what about)\s*,?\s*', '', clean, flags=re.IGNORECASE).strip()
                    chosen = stripped if len(stripped) >= 3 else clean
                    s.title = chosen[:40] + ("..." if len(chosen) > 40 else "")
                    updated = True
    if updated:
        try:
            db.commit()
        except Exception:
            db.rollback()

    return sessions


def update_chat_session_title(
    db: Session,
    session_id: int,
    title: str,
    user_id: int,
) -> ChatSession:
    session = get_chat_session(db, session_id, user_id)
    session.title = title
    db.commit()
    db.refresh(session)
    return session


def delete_chat_session(
    db: Session,
    session_id: int,
    user_id: int,
) -> None:
    """Delete a chat session."""
    session = get_chat_session(db, session_id, user_id)
    db.delete(session)
    db.commit()
